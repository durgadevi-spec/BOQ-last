import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    ChevronLeft,
    Loader2,
    Printer,
    Building2,
    Calendar,
    User,
    Mail,
    Phone,
} from "lucide-react";
import apiFetch from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface PurchaseOrder {
    id: string;
    po_number: string;
    project_id: string;
    vendor_id: string;
    status: string;
    total_amount: string;
    subtotal?: string;
    tax?: string;
    delivery_date: string | null;
    comments: string | null;
    created_at: string;
    project_name?: string;
    vendor_name?: string;
    vendor_location?: string;
    vendor_phone?: string;
    vendor_phone_code?: string;
    vendor_city?: string;
    vendor_state?: string;
    vendor_country?: string;
    vendor_pincode?: string;
    vendor_gstin?: string;
    project_client?: string;
    project_location?: string;
}

interface PurchaseOrderItem {
    id: string;
    item_name: string;
    description: string | null;
    unit: string | null;
    qty: string;
    rate: string;
    amount: string;
    hsn_code?: string;
    sac_code?: string;
}

export default function PurchaseOrderDetail() {
    const { id } = useParams();
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [po, setPo] = useState<PurchaseOrder | null>(null);
    const [items, setItems] = useState<PurchaseOrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showApprovalDialog, setShowApprovalDialog] = useState(false);
    const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve");
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const searchParams = new URLSearchParams(window.location.search);
    const mode = searchParams.get("mode");

    useEffect(() => {
        if (id) fetchPODetail();
    }, [id]);

    const fetchPODetail = async () => {
        try {
            setLoading(true);
            const res = await apiFetch(`/api/purchase-orders/${id}`);
            if (res.ok) {
                const data = await res.json();
                setPo(data.purchaseOrder);
                setItems(data.items || []);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load purchase order details.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus: string) => {
        try {
            const res = await apiFetch(`/api/purchase-orders/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                toast({ title: "Success", description: `PO status updated to ${newStatus}` });
                fetchPODetail();
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
        }
    };

    const handleApproval = async () => {
        setIsSubmitting(true);
        try {
            const res = await apiFetch(`/api/purchase-orders/${id}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    approve: approvalAction === "approve",
                    comment
                }),
            });
            if (res.ok) {
                toast({
                    title: approvalAction === "approve" ? "Approved" : "Rejected",
                    description: `Purchase order has been ${approvalAction === "approve" ? "approved" : "rejected"}.`,
                });
                setShowApprovalDialog(false);
                fetchPODetail();
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to process approval", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case "draft":
                return <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">Draft</Badge>;
            case "pending_approval":
                return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Pending Approval</Badge>;
            case "approved":
                return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Approved</Badge>;
            case "rejected":
                return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Rejected</Badge>;
            case "ordered":
                return <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200">Ordered</Badge>;
            case "delivered":
                return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Delivered</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Loading PO details...</p>
                </div>
            </Layout>
        );
    }

    if (!po) {
        return (
            <Layout>
                <div className="text-center py-10">
                    <h2 className="text-xl font-bold">Purchase Order not found.</h2>
                    <Button variant="link" onClick={() => setLocation("/purchase-orders")}>Go back to list</Button>
                </div>
            </Layout>
        );
    }

    // Calculations
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.amount || "0"), 0);
    const sgst = subtotal * 0.09;
    const cgst = subtotal * 0.09;
    const totalWithTax = subtotal + sgst + cgst;
    const grandTotal = Math.round(totalWithTax);

    return (
        <Layout>
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    body { background: white !important; }
                    .main-layout { padding: 0 !important; margin: 0 !important; }
                    .po-container { border: none !important; box-shadow: none !important; width: 100% !important; max-width: 100% !important; }
                    @page { margin: 10mm; size: A4; }
                }
                .watermark {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(-45deg);
                    font-size: 8rem;
                    font-weight: 900;
                    color: rgba(34, 197, 94, 0.1);
                    pointer-events: none;
                    z-index: 0;
                    white-space: nowrap;
                    text-transform: uppercase;
                }
            `}} />

            <div className="space-y-6 pb-20 relative main-layout">
                {/* Actions Header */}
                <div className="flex justify-between items-start no-print">
                    <div className="space-y-1">
                        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={() => setLocation("/purchase-orders")}>
                            <ChevronLeft className="h-4 w-4 mr-1" /> Back to List
                        </Button>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                            Purchase Order Detail
                            {getStatusBadge(po.status)}
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => window.print()}>
                            <Printer className="h-4 w-4 mr-2" /> Print PO
                        </Button>

                        {po.status === "draft" && (
                            <Button onClick={() => handleStatusUpdate("pending_approval")} className="bg-blue-600 hover:bg-blue-700 text-white">
                                Submit for Approval
                            </Button>
                        )}

                        {po.status === "pending_approval" && mode === "approval" && (
                            <>
                                <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50" onClick={() => { setApprovalAction("reject"); setShowApprovalDialog(true); }}>
                                    Reject
                                </Button>
                                <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => { setApprovalAction("approve"); setShowApprovalDialog(true); }}>
                                    Approve
                                </Button>
                            </>
                        )}

                        {po.status === "approved" && (
                            <Button onClick={() => handleStatusUpdate("ordered")} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                                Confirm Order Sent
                            </Button>
                        )}

                        {po.status === "ordered" && (
                            <Button onClick={() => handleStatusUpdate("delivered")} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                                Mark Delivered
                            </Button>
                        )}
                    </div>
                </div>

                {/* Main PO Document Card */}
                <Card className="max-w-[1000px] mx-auto border-slate-300 shadow-xl overflow-hidden bg-white po-container relative">
                    {po.status === 'approved' && <div className="watermark print-only hidden">Approved</div>}
                    {po.status === 'approved' && <div className="watermark no-print">Approved</div>}

                    <CardContent className="p-8 space-y-8 relative z-10">
                        {/* Header Section - Logo + Company Info + BILL badge */}
                        <div className="flex justify-between items-start pb-6">
                            <div className="flex items-start gap-4">
                                <img src="/logo.png" alt="Concept Trunk Interiors" className="h-20 w-auto" />
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-slate-800 tracking-wide">BILL</div>
                                <div className="text-sm text-slate-500 mt-1">Bill# <span className="font-semibold text-slate-700">{po.po_number}</span></div>
                            </div>
                        </div>

                        {/* Company Address Block */}
                        <div className="pb-4 border-b border-slate-200">
                            <div className="text-sm leading-relaxed text-slate-700">
                                <p className="font-semibold">Concept Trunk Interiors</p>
                                <p>12/36A, Indira Nagar</p>
                                <p>Medavakkam</p>
                                <p>Chennai Tamil Nadu 600100</p>
                                <p>India</p>
                                <p className="text-xs text-slate-500 mt-1">GSTIN 33ASOPS5560M1Z1</p>
                            </div>
                        </div>

                        {/* Bill From (Vendor) + Bill Date section */}
                        <div className="grid grid-cols-2 gap-8 py-4">
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Bill From</p>
                                <p className="font-semibold text-slate-800">{po.vendor_name || "Vendor"}</p>
                                {po.vendor_location && <p className="text-sm text-slate-600">{po.vendor_location}</p>}
                                {po.vendor_city && <p className="text-sm text-slate-600">{po.vendor_city}</p>}
                                {(po.vendor_state || po.vendor_pincode) && (
                                    <p className="text-sm text-slate-600">
                                        {po.vendor_state || ''} {po.vendor_pincode || ''}
                                    </p>
                                )}
                                <p className="text-sm text-slate-600">India</p>
                                {po.vendor_gstin && (
                                    <p className="text-xs text-slate-500 mt-1">GSTIN {po.vendor_gstin}</p>
                                )}
                            </div>
                            <div className="text-right space-y-2">
                                <div className="flex justify-end gap-8">
                                    <span className="text-sm text-slate-500">Bill Date :</span>
                                    <span className="text-sm font-medium text-slate-700">{new Date(po.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                </div>
                                {po.delivery_date && (
                                    <div className="flex justify-end gap-8">
                                        <span className="text-sm text-slate-500">Due Date :</span>
                                        <span className="text-sm font-medium text-slate-700">{new Date(po.delivery_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                    </div>
                                )}
                                <div className="flex justify-end gap-8">
                                    <span className="text-sm text-slate-500">Customer Name :</span>
                                    <span className="text-sm font-medium text-slate-700 uppercase">{po.project_client || po.project_name || '—'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="border border-slate-300 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-100 border-b border-slate-300">
                                        <TableHead className="text-slate-700 font-semibold w-12 text-center text-xs py-2">#</TableHead>
                                        <TableHead className="text-slate-700 font-semibold text-xs py-2">Item & Description</TableHead>
                                        <TableHead className="text-slate-700 font-semibold text-xs text-center py-2">HSN/SAC</TableHead>
                                        <TableHead className="text-slate-700 font-semibold text-xs text-center py-2">Qty</TableHead>
                                        <TableHead className="text-slate-700 font-semibold text-xs text-right py-2">Rate</TableHead>
                                        <TableHead className="text-slate-700 font-semibold text-xs text-right py-2 pr-4">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item, idx) => (
                                        <TableRow key={item.id} className="border-b border-slate-200">
                                            <TableCell className="text-center text-sm text-slate-500">{idx + 1}</TableCell>
                                            <TableCell>
                                                <div className="text-sm text-slate-800">{item.item_name}</div>
                                                {item.description && <div className="text-xs text-slate-400 mt-0.5">{item.description}</div>}
                                                {item.unit && <div className="text-xs text-slate-400">{item.unit}</div>}
                                            </TableCell>
                                            <TableCell className="text-center text-sm text-slate-600">{item.hsn_code || item.sac_code || ""}</TableCell>
                                            <TableCell className="text-center text-sm">{parseFloat(item.qty).toFixed(2)}</TableCell>
                                            <TableCell className="text-right text-sm">{parseFloat(item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                                            <TableCell className="text-right text-sm font-medium pr-4">{parseFloat(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Totals Section */}
                        <div className="flex justify-end">
                            <div className="w-72 space-y-1">
                                <div className="flex justify-between text-sm py-1">
                                    <span className="text-slate-600 font-medium">Sub Total</span>
                                    <span className="text-slate-800">{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-sm py-1">
                                    <span className="text-slate-600">SGST9 (9%)</span>
                                    <span className="text-slate-800">{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-sm py-1">
                                    <span className="text-slate-600">CGST9 (9%)</span>
                                    <span className="text-slate-800">{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-sm py-1">
                                    <span className="text-slate-600">Round off</span>
                                    <span className="text-slate-800">{(grandTotal - totalWithTax).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-semibold py-2 border-t border-slate-300">
                                    <span className="text-slate-800">Total</span>
                                    <span className="text-slate-900">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-sm font-semibold py-2 bg-slate-100 px-2 -mx-2">
                                    <span className="text-slate-800">Balance Due</span>
                                    <span className="text-slate-900 font-bold">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer - Authorized Signature */}
                        <div className="pt-12 pb-4">
                            <div className="text-sm text-slate-700">
                                <span className="font-medium">Authorized Signature</span>
                                <span className="inline-block w-64 border-b border-slate-400 ml-2"></span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Approval Dialog */}
            <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{approvalAction === "approve" ? "Approve Purchase Order" : "Reject Purchase Order"}</DialogTitle>
                        <DialogDescription>
                            {approvalAction === "approve"
                                ? "Provide optional comments for this approval."
                                : "Provide a reason for rejecting this purchase order."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Enter your comments here..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowApprovalDialog(false)} disabled={isSubmitting}>Cancel</Button>
                        <Button
                            className={approvalAction === "approve" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
                            onClick={handleApproval}
                            disabled={isSubmitting || (approvalAction === "reject" && !comment.trim())}
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {approvalAction === "approve" ? "Approve" : "Reject"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}
