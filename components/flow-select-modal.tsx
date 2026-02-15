"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface FlowSelectModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    flowName: string
}

export function FlowSelectModal({ open, onOpenChange, onConfirm, flowName }: FlowSelectModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl">Select Confirmation</DialogTitle>
                    <DialogDescription className="text-base pt-2">
                        Are you sure you want to select <strong>{flowName}</strong>?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex gap-3 sm:justify-end mt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 sm:flex-none border-2 border-border font-semibold h-11 px-8 rounded-xl"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={onConfirm}
                        className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11 px-8 rounded-xl"
                    >
                        Select
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
