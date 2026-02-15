"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
import { phoneService } from "@/services/phone-service"
import { LoaderOverlay } from "@/components/auth/loader-overlay"
import { ToastNotification } from "@/components/auth/toast-notification"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FinalSubmissionModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onBack: () => void
    onSuccess: (bundleData: any) => void
}

interface BundleData {
    bundle: any
    endUser: any
    address: any
}

export function FinalSubmissionModal({ open, onOpenChange, onBack, onSuccess }: FinalSubmissionModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [showErrorDialog, setShowErrorDialog] = useState(false)
    const [toast, setToast] = useState<any>(null)
    const [bundleData, setBundleData] = useState<BundleData>({ bundle: {}, endUser: {}, address: {} })
    const [isHydrated, setIsHydrated] = useState(false)

    useEffect(() => {
        if (typeof window !== "undefined") {
            setIsHydrated(true)
            if (open) {
                const bundle = localStorage.getItem("bundleData") ? JSON.parse(localStorage.getItem("bundleData") || "{}") : {}
                const endUser = localStorage.getItem("endUserData")
                    ? JSON.parse(localStorage.getItem("endUserData") || "{}")
                    : {}
                const address = localStorage.getItem("addressData")
                    ? JSON.parse(localStorage.getItem("addressData") || "{}")
                    : {}
                setBundleData({ bundle, endUser, address })
            }
        }
    }, [open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        try {
            setIsLoading(true)
            const { bundle, endUser, address } = bundleData

            // Validate data
            if (!bundle.friendly_name || !bundle.country_code || !bundle.number_type || !bundle.email) {
                setError("Bundle data is incomplete")
                setShowErrorDialog(true)
                return
            }

            if (
                !endUser.friendly_name ||
                !endUser.first_name ||
                !endUser.last_name ||
                !endUser.email ||
                !endUser.phone_number
            ) {
                setError("End user data is incomplete")
                setShowErrorDialog(true)
                return
            }

            if (!address.customer_name || !address.street || !address.city || !address.iso_country) {
                setError("Address data is incomplete")
                setShowErrorDialog(true)
                return
            }

            // Create Bundle
            const bundleResponse = await phoneService.createBundle(bundle);
            const bundleId = bundleResponse.data.bundle.id

            // Create End User
            await phoneService.createEndUser({
                ...endUser,
                bundle_id: bundleId
            });

            // Create Address
            await phoneService.createAddress({
                ...address,
                bundle_id: bundleId
            });

            if (typeof window !== "undefined") {
                localStorage.removeItem("bundleData")
                localStorage.removeItem("endUserData")
                localStorage.removeItem("addressData")
            }

            setToast({
                title: "Success",
                description: "Bundle created successfully",
                variant: "default",
            })

            onSuccess({ id: bundleId, ...bundle })
        } catch (err: any) {
            console.log("Error submitting bundle:", err)
            const errorMessage = err.response?.data?.error || "Failed to create bundle"
            setError(errorMessage)
            setShowErrorDialog(true)
        } finally {
            setIsLoading(false)
        }
    }

    if (!isHydrated) {
        return null
    }

    const { bundle, endUser, address } = bundleData

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <LoaderOverlay isLoading={isLoading} />
                    {toast && (
                        <ToastNotification
                            title={toast.title}
                            description={toast.description}
                            variant={toast.variant}
                            onClose={() => setToast(null)}
                        />
                    )}

                    <DialogHeader>
                        <DialogTitle className="text-2xl">Review & Submit</DialogTitle>
                        <DialogDescription>Verify all information before submission</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Bundle Info */}
                        <div>
                            <h3 className="font-semibold text-lg text-foreground mb-3">Bundle Information</h3>
                            <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-2">
                                <p>
                                    <span className="font-medium">Name:</span> {bundle.friendly_name}
                                </p>
                                <p>
                                    <span className="font-medium">Country:</span> {bundle.country_code}
                                </p>
                                <p>
                                    <span className="font-medium">Number Type:</span> {bundle.number_type}
                                </p>
                                <p>
                                    <span className="font-medium">Email:</span> {bundle.email}
                                </p>
                            </div>
                        </div>

                        {/* End User Info */}
                        <div>
                            <h3 className="font-semibold text-lg text-foreground mb-3">End User Information</h3>
                            <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-2">
                                <p>
                                    <span className="font-medium">Friendly Name:</span> {endUser.friendly_name}
                                </p>
                                <p>
                                    <span className="font-medium">Business:</span> {endUser.business_name}
                                </p>
                                <p>
                                    <span className="font-medium">Name:</span> {endUser.first_name} {endUser.last_name}
                                </p>
                                <p>
                                    <span className="font-medium">Email:</span> {endUser.email}
                                </p>
                                <p>
                                    <span className="font-medium">Phone:</span> {endUser.phone_number}
                                </p>
                            </div>
                        </div>

                        {/* Address Info */}
                        <div>
                            <h3 className="font-semibold text-lg text-foreground mb-3">Address Information</h3>
                            <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-2">
                                <p>
                                    <span className="font-medium">Customer:</span> {address.customer_name}
                                </p>
                                <p>
                                    <span className="font-medium">Street:</span> {address.street}
                                </p>
                                <p>
                                    <span className="font-medium">City:</span> {address.city}
                                </p>
                                <p>
                                    <span className="font-medium">Country:</span> {address.iso_country}
                                </p>
                                <p>
                                    <span className="font-medium">Postal:</span> {address.postal_code}
                                </p>
                            </div>
                        </div>

                        <DialogFooter className="flex gap-3 pt-6 border-t border-border">
                            <Button
                                type="button"
                                onClick={onBack}
                                variant="outline"
                                className="cursor-pointer flex-1 border-2 border-border bg-gradient-to-r from-primary/20 to-primary/20 dark:hover:text-white/50"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="cursor-pointer flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        Submit
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">Error</AlertDialogTitle>
                        <AlertDialogDescription>
                            {error}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setShowErrorDialog(false)}>
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
