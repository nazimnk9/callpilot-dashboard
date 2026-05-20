"use client"

import { useState, useEffect } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit2, Trash2, Mail, Phone, Shield, Calendar, UserPlus, X, Loader2, Send } from "lucide-react"
import { profileService } from "@/services/profile-service"
import { LoaderOverlay } from "@/components/auth/loader-overlay"
import { ToastNotification } from "@/components/auth/toast-notification"
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface OrgUser {
    id: number
    uid: string
    organization: number
    user: {
        uid: string
        first_name: string
        last_name: string
        email: string
        phone: string
    }
    role: string
    is_active: boolean
    joined_at: string
    last_active: string | null
}

interface OrgInvite {
    id: number
    organization: number
    sender: number
    role: string
    email: string
    invitation_status: string
}

export function OrganizationUsersContent() {
    const [users, setUsers] = useState<OrgUser[]>([])
    const [invites, setInvites] = useState<OrgInvite[]>([])
    const [activeTab, setActiveTab] = useState<"users" | "invites">("users")
    const [isLoading, setIsLoading] = useState(true)
    const [toast, setToast] = useState<{
        title: string
        description: string
        variant: "default" | "destructive"
    } | null>(null)

    // Invite Modal States
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
    const [inviteRole, setInviteRole] = useState("")
    const [inviteEmail, setInviteEmail] = useState("")
    const [invitePassword, setInvitePassword] = useState("")
    const [isInviting, setIsInviting] = useState(false)

    // Edit Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<OrgUser | null>(null)
    const [editRole, setEditRole] = useState("")
    const [editEmail, setEditEmail] = useState("")
    const [editPassword, setEditPassword] = useState("")
    const [isUpdating, setIsUpdating] = useState(false)

    // Delete Modal States
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [userToDelete, setUserToDelete] = useState<OrgUser | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Organization Role States
    const [currentUserRole, setCurrentUserRole] = useState<string>("")
    const [currentOrg, setCurrentOrg] = useState<any>(null)

    const handleOpenEditModal = (user: OrgUser) => {
        setSelectedUser(user)
        setEditEmail(user.user.email || "")
        setEditRole(user.role || "")
        setEditPassword("")
        setIsEditModalOpen(true)
    }

    const handleUpdateUser = async () => {
        if (!selectedUser) return

        if (!editRole || !editEmail) {
            setToast({
                title: "Error",
                description: "Email and Role are required fields",
                variant: "destructive",
            })
            return
        }

        try {
            setIsUpdating(true)
            const payload: { role?: string; email?: string; password?: string } = {
                role: editRole,
                email: editEmail,
            }
            if (editPassword) {
                payload.password = editPassword
            }

            await profileService.updateOrganizationUser(selectedUser.uid, payload)

            setToast({
                title: "Success",
                description: `User ${editEmail} updated successfully`,
                variant: "default",
            })
            setIsEditModalOpen(false)
            fetchUsers()
        } catch (err: any) {
            console.error("Error updating user:", err)

            // Extract error message from API response
            const responseData = err.response?.data
            let errorMessage = "Failed to update user"

            if (responseData) {
                if (responseData.email && Array.isArray(responseData.email) && responseData.email.length > 0) {
                    errorMessage = responseData.email[0]
                } else if (responseData.detail) {
                    errorMessage = responseData.detail
                } else if (responseData.error) {
                    errorMessage = responseData.error
                }
            }

            setToast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            })
        } finally {
            setIsUpdating(false)
        }
    }

    const handleOpenDeleteModal = (user: OrgUser) => {
        setUserToDelete(user)
        setIsDeleteModalOpen(true)
    }

    const handleDeleteUser = async () => {
        if (!userToDelete) return

        try {
            setIsDeleting(true)
            await profileService.deleteOrganizationUser(userToDelete.uid)

            setToast({
                title: "Success",
                description: `User ${userToDelete.user.email} removed successfully`,
                variant: "default",
            })
            setIsDeleteModalOpen(false)
            fetchUsers()
        } catch (err: any) {
            console.error("Error deleting user:", err)

            // Extract error message from API response
            const responseData = err.response?.data
            let errorMessage = "Failed to remove user"

            if (responseData) {
                if (responseData.detail) {
                    errorMessage = responseData.detail
                } else if (responseData.error) {
                    errorMessage = responseData.error
                }
            }

            setToast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            })
        } finally {
            setIsDeleting(false)
        }
    }

    useEffect(() => {
        const fetchRole = async () => {
            try {
                const response = await profileService.getOrganization()
                if (response.data) {
                    setCurrentOrg(response.data)
                    setCurrentUserRole(response.data.role || "")
                }
            } catch (err) {
                console.error("Error fetching current user organization profile:", err)
            }
        }
        fetchRole()
    }, [])

    useEffect(() => {
        if (activeTab === "users") {
            fetchUsers()
        } else {
            fetchInvites()
        }
    }, [activeTab])

    const fetchUsers = async () => {
        try {
            setIsLoading(true)
            const response = await profileService.getOrganizationUsers()
            setUsers(response.data.results || [])
        } catch (err: any) {
            console.error("Error fetching users:", err)
            setToast({
                title: "Error",
                description: "Failed to fetch organization users",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const fetchInvites = async () => {
        try {
            setIsLoading(true)
            const response = await profileService.getSentInvitations()
            setInvites(response.data.results || [])
        } catch (err: any) {
            console.error("Error fetching invites:", err)
            setToast({
                title: "Error",
                description: "Failed to fetch sent invitations",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleInviteUser = async () => {
        if (!inviteRole || !inviteEmail || !invitePassword) {
            setToast({
                title: "Error",
                description: "Please fill in all fields",
                variant: "destructive",
            })
            return
        }

        try {
            setIsInviting(true)
            await profileService.inviteUser({
                role: inviteRole,
                email: inviteEmail,
                password: invitePassword
            })
            setToast({
                title: "Success",
                description: `Invitation sent to ${inviteEmail}`,
                variant: "default",
            })
            setIsInviteModalOpen(false)
            setInviteRole("")
            setInviteEmail("")
            setInvitePassword("")

            if (activeTab === "invites") {
                fetchInvites()
            } else {
                fetchUsers()
            }
        } catch (err: any) {
            console.error("Error inviting user:", err)

            // Extract error message from API response
            const responseData = err.response?.data
            let errorMessage = "Failed to send invitation"

            if (responseData) {
                if (responseData.email && Array.isArray(responseData.email) && responseData.email.length > 0) {
                    errorMessage = responseData.email[0]
                } else if (responseData.detail) {
                    errorMessage = responseData.detail
                } else if (responseData.error) {
                    errorMessage = responseData.error
                }
            }

            setToast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            })
        } finally {
            setIsInviting(false)
        }
    }

    const formatTimestamp = (timestamp: string) => {
        if (!timestamp) return "N/A"
        return new Date(timestamp).toLocaleDateString()
    }

    return (
        <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-950">
            <LoaderOverlay isLoading={isLoading} />

            {toast && (
                <ToastNotification
                    title={toast.title}
                    description={toast.description}
                    variant={toast.variant}
                    onClose={() => setToast(null)}
                />
            )}

            <div className="p-4 md:p-8 space-y-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="space-y-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Organization Users</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage your team members and their roles.</p>
                        </div>

                        {/* <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
                            <Button
                                onClick={() => setActiveTab("users")}
                                variant="ghost"
                                className={cn(
                                    "h-9 px-6 rounded-lg text-sm font-semibold transition-all",
                                    activeTab === "users"
                                        ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                )}
                            >
                                User
                            </Button>
                            <Button
                                onClick={() => setActiveTab("invites")}
                                variant="ghost"
                                className={cn(
                                    "h-9 px-6 rounded-lg text-sm font-semibold transition-all",
                                    activeTab === "invites"
                                        ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                )}
                            >
                                Invite
                            </Button>
                        </div> */}
                    </div>
                    <Button
                        onClick={() => setIsInviteModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-11 px-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all font-semibold"
                    >
                        <UserPlus className="h-5 w-5" />
                        Add User
                    </Button>
                </div>

                <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden rounded-xl">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                        {activeTab === "users" ? (
                                            <>
                                                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4 px-6">User</TableHead>
                                                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4 px-6">Contact</TableHead>
                                                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4 px-6">Role</TableHead>
                                                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4 px-6">Status</TableHead>
                                                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4 px-6">Joined Date</TableHead>
                                            </>
                                        ) : (
                                            <>
                                                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4 px-6">Email</TableHead>
                                                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4 px-6">Role</TableHead>
                                                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4 px-6">Status</TableHead>
                                            </>
                                        )}
                                        <TableHead className="text-right font-semibold text-gray-900 dark:text-gray-100 py-4 px-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activeTab === "users" ? (
                                        users.length === 0 && !isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-48 text-center text-gray-500 italic">
                                                    No users found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            users.map((item) => (
                                                <TableRow key={item.uid} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-50 dark:border-gray-800/50">
                                                    <TableCell className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800">
                                                                {item.user.first_name?.[0]}{item.user.last_name?.[0]}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-gray-900 dark:text-gray-100">
                                                                    {item.user.first_name} {item.user.last_name}
                                                                </div>
                                                                {/* <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium opacity-70">UID: {item.uid.substring(0, 8)}...</div> */}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-6">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                                <Mail className="h-3.5 w-3.5 text-gray-400" />
                                                                {item.user.email}
                                                            </div>
                                                            {item.user.phone && (
                                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                                                                    {item.user.phone}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-6">
                                                        <div className="flex items-center gap-2">
                                                            <Shield className="h-4 w-4 text-blue-500" />
                                                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{item.role}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-6">
                                                        <Badge
                                                            variant="outline"
                                                            className={item.is_active
                                                                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800 px-2.5 py-0.5 rounded-lg"
                                                                : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800 px-2.5 py-0.5 rounded-lg"}
                                                        >
                                                            {item.is_active ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-gray-400" />
                                                            {formatTimestamp(item.joined_at)}
                                                        </div>
                                                    </TableCell>
                                                     <TableCell className="py-4 px-6 text-right">
                                                         <div className="flex justify-end gap-2">
                                                             {(currentUserRole === "ADMINISTRATOR" || currentUserRole === "OWNER") && (
                                                                 <Button
                                                                     onClick={() => handleOpenEditModal(item)}
                                                                     variant="ghost"
                                                                     size="icon"
                                                                     className="h-9 w-9 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-all"
                                                                 >
                                                                     <Edit2 className="h-4 w-4" />
                                                                 </Button>
                                                             )}
                                                             {currentUserRole === "ADMINISTRATOR" && (
                                                                 <Button
                                                                     onClick={() => handleOpenDeleteModal(item)}
                                                                     variant="ghost"
                                                                     size="icon"
                                                                     className="h-9 w-9 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all"
                                                                 >
                                                                     <Trash2 className="h-4 w-4" />
                                                                 </Button>
                                                             )}
                                                         </div>
                                                     </TableCell>
                                                </TableRow>
                                            ))
                                        )
                                    ) : (
                                        invites.length === 0 && !isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-48 text-center text-gray-500 italic">
                                                    No invitations found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            invites.map((item) => (
                                                <TableRow key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-50 dark:border-gray-800/50">
                                                    <TableCell className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold border border-orange-200 dark:border-orange-800">
                                                                <Mail className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-gray-900 dark:text-gray-100">
                                                                    {item.email}
                                                                </div>
                                                                {/* <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium opacity-70">Invitation ID: {item.id}</div> */}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-6">
                                                        <div className="flex items-center gap-2">
                                                            <Shield className="h-4 w-4 text-orange-500" />
                                                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize">{item.role.toLowerCase()}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-6">
                                                        <Badge
                                                            variant="outline"
                                                            className="bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200 dark:border-orange-800 px-2.5 py-0.5 rounded-lg capitalize"
                                                        >
                                                            {item.invitation_status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-6 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 transition-all">
                                                                <Send className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Invite User Modal */}
            <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 rounded-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-0">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <span className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                    <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </span>
                                Invite Team Member
                            </DialogTitle>
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Email Address <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter colleague's email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    required
                                    className="h-11 rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-blue-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Password <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter password"
                                    value={invitePassword}
                                    onChange={(e) => setInvitePassword(e.target.value)}
                                    required
                                    className="h-11 rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-blue-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Assign Role <span className="text-red-500">*</span>
                                </Label>
                                <Select value={inviteRole} onValueChange={setInviteRole}>
                                    <SelectTrigger className="h-11 rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-gray-200 dark:border-gray-800">
                                        <SelectItem value="OWNER" className="rounded-lg">Owner</SelectItem>
                                        <SelectItem value="ADMINISTRATOR" className="rounded-lg">Administrator</SelectItem>
                                        <SelectItem value="STAFF" className="rounded-lg">Staff</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 pt-2 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsInviteModalOpen(false)}
                            className="h-11 rounded-xl border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleInviteUser}
                            disabled={isInviting || !inviteEmail || !inviteRole || !invitePassword}
                            className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 flex-1 gap-2"
                        >
                            {isInviting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                "Add User"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Update User Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 rounded-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-0">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <span className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                    <Edit2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </span>
                                Update Team Member
                            </DialogTitle>
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Email Address <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="edit-email"
                                    type="email"
                                    placeholder="Enter colleague's email"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    required
                                    className="h-11 rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-blue-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Password <span className="text-gray-400 text-xs font-normal">(Leave blank to keep unchanged)</span>
                                </Label>
                                <Input
                                    id="edit-password"
                                    type="password"
                                    placeholder="Enter new password"
                                    value={editPassword}
                                    onChange={(e) => setEditPassword(e.target.value)}
                                    className="h-11 rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-blue-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-role" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Assign Role <span className="text-red-500">*</span>
                                </Label>
                                <Select value={editRole} onValueChange={setEditRole}>
                                    <SelectTrigger className="h-11 rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-gray-200 dark:border-gray-800">
                                        <SelectItem value="OWNER" className="rounded-lg">Owner</SelectItem>
                                        <SelectItem value="ADMINISTRATOR" className="rounded-lg">Administrator</SelectItem>
                                        <SelectItem value="STAFF" className="rounded-lg">Staff</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 pt-2 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsEditModalOpen(false)}
                            className="h-11 rounded-xl border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdateUser}
                            disabled={isUpdating || !editEmail || !editRole}
                            className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 flex-1 gap-2"
                        >
                            {isUpdating ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Update"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 rounded-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-0">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <span className="p-2 bg-red-50 dark:bg-red-950/30 rounded-lg">
                                    <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                                </span>
                                Remove Team Member
                            </DialogTitle>
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            Are you sure you want to remove{" "}
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                                {userToDelete?.user?.first_name || userToDelete?.user?.last_name
                                    ? `${userToDelete.user.first_name} ${userToDelete.user.last_name}`.trim()
                                    : "this member"}
                            </span>{" "}
                            ({userToDelete?.user?.email}) from this organization?
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-950/30 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
                            Warning: This action cannot be undone and they will immediately lose access to the organization's dashboard.
                        </p>
                    </div>

                    <DialogFooter className="p-6 pt-2 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="h-11 rounded-xl border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeleteUser}
                            disabled={isDeleting}
                            className="h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 flex-1 gap-2"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Removing...
                                </>
                            ) : (
                                "Remove User"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
