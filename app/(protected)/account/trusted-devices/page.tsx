"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Smartphone } from "lucide-react";
import QRCode from "qrcode";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RouteGuard } from "@/components/rbac/route-guard";
import { Permissions } from "@/lib/rbac/permissions";
import { meApi } from "@/lib/api/modules/me";
import {
  tanDevicesApi,
  type EnrollmentQrResponse,
  type TanDevice,
} from "@/lib/api/modules/tan-devices";
import {
  tanDeviceConfirmSchema,
  type TanDeviceConfirmInput,
} from "@/lib/schemas/tan-devices";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CopyableUuid } from "@/components/data/copyable-uuid";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ApiError, describeApiError } from "@/lib/api/errors";
import { handleStepUpOnError, startStepUp } from "@/lib/auth/step-up";
import { ConfirmAction } from "@/components/data/confirm-action";
import { formatDateTime } from "@/lib/utils";

export default function TrustedDevicesPage() {
  return (
    <RouteGuard permissions={[Permissions.MfaManageOwn]}>
      <TrustedDevicesContent />
    </RouteGuard>
  );
}

function isDeviceLimitError(error: unknown): boolean {
  if (!(error instanceof ApiError) || !error.isConflict) return false;
  const type = (error.payload as { type?: string }).type ?? "";
  return (
    type.includes("tan-device-limit") ||
    error.payload.title?.includes("TAN Device Limit") === true
  );
}

function isQrExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() <= Date.now();
}

function TrustedDevicesContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [enrollmentQr, setEnrollmentQr] = React.useState<EnrollmentQrResponse | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = React.useState<TanDevice | null>(null);
  const [secondsRemaining, setSecondsRemaining] = React.useState<number | null>(null);

  const profile = useQuery({ queryKey: ["me", "profile"], queryFn: meApi.profile });

  const qrActive =
    enrollmentQr !== null && !isQrExpired(enrollmentQr.expiresAt);

  const devices = useQuery({
    queryKey: ["tan-devices"],
    queryFn: tanDevicesApi.list,
    refetchInterval: qrActive ? 3000 : false,
  });

  const pendingDevice = devices.data?.find((d) => d.status === "PENDING_ENROLLMENT");

  React.useEffect(() => {
    if (!enrollmentQr?.qrPayload) {
      setQrCodeDataUrl(null);
      return;
    }

    let cancelled = false;
    void QRCode.toDataURL(enrollmentQr.qrPayload, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: "L",
    }).then((url) => {
      if (!cancelled) setQrCodeDataUrl(url);
    });

    return () => {
      cancelled = true;
    };
  }, [enrollmentQr?.qrPayload]);

  React.useEffect(() => {
    if (!enrollmentQr?.expiresAt) {
      setSecondsRemaining(null);
      return;
    }

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(enrollmentQr.expiresAt).getTime() - Date.now()) / 1000),
      );
      setSecondsRemaining(remaining);
      if (remaining === 0) {
        setEnrollmentQr(null);
        setQrCodeDataUrl(null);
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [enrollmentQr?.expiresAt]);

  const handleSensitiveError = (error: unknown, title: string): boolean => {
    if (handleStepUpOnError(error)) return true;
    if (isDeviceLimitError(error)) {
      toast({
        variant: "destructive",
        title: "Device limit reached",
        description: "Revoke an existing trusted device before enrolling another.",
      });
      return true;
    }
    toast({
      variant: "destructive",
      title,
      description: describeApiError(error),
    });
    return true;
  };

  const enrollmentMutation = useMutation({
    mutationFn: tanDevicesApi.createEnrollmentQr,
    onSuccess: (data) => {
      setEnrollmentQr(data);
      toast({ title: "Scan the QR code in the Minab TAN app" });
    },
    onError: (error) => {
      handleSensitiveError(error, "Could not create enrollment QR");
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (deviceId: string) => tanDevicesApi.revoke(deviceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tan-devices"] });
      toast({ title: "Trusted device revoked" });
    },
    onError: (error) => {
      handleSensitiveError(error, "Could not revoke device");
    },
  });

  const confirmForm = useForm<TanDeviceConfirmInput>({
    resolver: zodResolver(tanDeviceConfirmSchema),
    defaultValues: { confirmationCode: "" },
  });

  const confirmMutation = useMutation({
    mutationFn: (input: TanDeviceConfirmInput) => {
      if (!pendingDevice) throw new Error("No pending device");
      return tanDevicesApi.confirm(pendingDevice.id, input);
    },
    onSuccess: () => {
      confirmForm.reset();
      setEnrollmentQr(null);
      setQrCodeDataUrl(null);
      void queryClient.invalidateQueries({ queryKey: ["tan-devices"] });
      toast({ title: "Device confirmed", description: "Your TAN device is now active." });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Confirmation failed",
        description: describeApiError(error),
      });
    },
  });

  const mfaEnabled = profile.data?.mfaEnabled ?? false;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trusted devices"
        description="Enrol the Minab TAN app on your phone to authorize payments with a dynamic transaction code."
      />

      {!mfaEnabled && !profile.isLoading ? (
        <Card className="border-warning/40 bg-warning/10">
          <CardHeader>
            <CardTitle>Multi-factor authentication required</CardTitle>
            <CardDescription>
              Set up MFA before enrolling a trusted device. Step-up verification uses your
              authenticator app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/account/mfa">Set up MFA</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Your trusted devices</CardTitle>
          <CardDescription>
            Phones enrolled to generate TAN codes for payment authorization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {devices.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : devices.data?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>UUID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Last used</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.data.map((device) => (
                  <TableRow
                    key={device.id}
                    className={
                      device.status === "PENDING_ENROLLMENT"
                        ? "bg-warning/10"
                        : undefined
                    }
                  >
                    <TableCell>
                      <CopyableUuid value={device.id} />
                    </TableCell>
                    <TableCell>{device.deviceName}</TableCell>
                    <TableCell>
                      <DeviceStatusBadge status={device.status} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatDateTime(device.enrolledAt)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatDateTime(device.lastUsedAt)}
                    </TableCell>
                    <TableCell>
                      {device.status === "ACTIVE" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => setRevokeTarget(device)}
                        >
                          Revoke
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={<Smartphone className="h-5 w-5" />}
              title="No trusted devices"
              description="Add a device to authorize payments from the Minab TAN app."
            />
          )}
        </CardContent>
      </Card>

      {mfaEnabled ? (
        <Card>
          <CardHeader>
            <CardTitle>Add trusted device</CardTitle>
            <CardDescription>
              Open the Minab TAN app, choose Enroll device, and scan the QR code below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!enrollmentQr ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => enrollmentMutation.mutate()}
                  loading={enrollmentMutation.isPending}
                >
                  Add trusted device
                </Button>
                <Button type="button" variant="outline" onClick={() => startStepUp()}>
                  Verify with MFA
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {qrCodeDataUrl ? (
                  <div className="flex flex-col items-start gap-2 rounded-md border bg-muted/30 p-3">
                    <p className="text-sm font-medium">Scan in Minab TAN app</p>
                    <Image
                      src={qrCodeDataUrl}
                      alt="TAN enrollment QR code"
                      width={400}
                      height={400}
                      unoptimized
                      className="rounded border bg-white p-2"
                    />
                    {secondsRemaining !== null ? (
                      <p className="text-xs text-muted-foreground">
                        Expires in {Math.floor(secondsRemaining / 60)}:
                        {String(secondsRemaining % 60).padStart(2, "0")}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                  <p className="font-medium">Enrollment URL</p>
                  <p className="break-all font-mono text-xs">{enrollmentQr.qrPayload}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  If the phone cannot scan this QR (common on real devices), copy the enrollment
                  link below into the TAN app under &quot;Enroll from link&quot;.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEnrollmentQr(null);
                    setQrCodeDataUrl(null);
                  }}
                >
                  Cancel enrollment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {pendingDevice ? (
        <Card>
          <CardHeader>
            <CardTitle>Confirm enrollment</CardTitle>
            <CardDescription>
              Enter the 8-digit code shown on your phone after scanning the QR code for{" "}
              <span className="font-medium">{pendingDevice.deviceName}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex items-end gap-3"
              onSubmit={confirmForm.handleSubmit((data) => confirmMutation.mutate(data))}
            >
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="confirmationCode">Confirmation code</Label>
                <Input
                  id="confirmationCode"
                  inputMode="numeric"
                  maxLength={8}
                  autoComplete="one-time-code"
                  {...confirmForm.register("confirmationCode")}
                />
                {confirmForm.formState.errors.confirmationCode ? (
                  <p className="text-xs text-destructive">
                    {confirmForm.formState.errors.confirmationCode.message}
                  </p>
                ) : null}
              </div>
              <Button type="submit" loading={confirmMutation.isPending}>
                Confirm device
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <ConfirmAction
        open={revokeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
        title="Revoke trusted device?"
        description={
          revokeTarget
            ? `Remove ${revokeTarget.deviceName} from your account. It will no longer authorize payments.`
            : undefined
        }
        confirmLabel="Revoke device"
        destructive
        omitReasonField
        onConfirm={async () => {
          if (!revokeTarget) return;
          await revokeMutation.mutateAsync(revokeTarget.id);
          setRevokeTarget(null);
        }}
      />
    </div>
  );
}

function DeviceStatusBadge({ status }: { status: TanDevice["status"] }) {
  switch (status) {
    case "ACTIVE":
      return <Badge variant="success">Active</Badge>;
    case "PENDING_ENROLLMENT":
      return <Badge variant="warning">Pending confirmation</Badge>;
    default:
      return <Badge variant="muted">{status}</Badge>;
  }
}
