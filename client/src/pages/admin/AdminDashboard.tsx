import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useData, Material, Shop } from "@/lib/store";
import { Plus, Trash2, Package, MessageSquare, AlertTriangle, CheckCircle2, XCircle, Layers, Search, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { postJSON, apiFetch } from "@/lib/api";
import { Link, useLocation } from "wouter";

const Required = () => <span className="text-red-500 ml-1">*</span>;

const UNIT_OPTIONS = [
  "pcs", "kg", "meter", "sqft", "cum", "litre", "set", "nos", "Meters", "Square feet",
  "Numbers", "Square Meter", "Bags", "Running feet", "Running meter", "LS", "BOX", "LTR",
  "CQM", "cft", "ml", "DOZ", "PKT", "Man labour", "Points", "Roll", "Days", "Inches",
  "Hours", "Percentage", "Length", "Panel", "Drum", "Ft", "1 Pkt", "Job", "Units"
];

const COUNTRY_CODES = [
  { code: "+91", country: "India" },
  { code: "+1", country: "USA" },
  { code: "+44", country: "UK" },
  { code: "+61", country: "Australia" },
  { code: "+971", country: "UAE" },
  { code: "+81", country: "Japan" },
  { code: "+49", country: "Germany" },
];

export default function AdminDashboard() {
  const { toast } = useToast();
  const {
    shops, materials, user,
    approvalRequests: shopRequests, setApprovalRequests: setShopRequests,
    supportMessages, submitShopForApproval, submitMaterialForApproval,
    approveShop, rejectShop, deleteShop, deleteMaterial,
    addSupportMessage, deleteMessage,
    materialApprovalRequests: materialRequests,
    approveMaterial, rejectMaterial,
  } = useData();

  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  // Categories & Subcategories
  const [categories, setCategories] = useState<string[]>([]);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState("");
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [newSubCategory, setNewSubCategory] = useState("");
  const [selectedCategoryForSubCategory, setSelectedCategoryForSubCategory] = useState("");
  const [editingSubCategoryId, setEditingSubCategoryId] = useState<string | null>(null);
  const [editingSubCategoryName, setEditingSubCategoryName] = useState("");
  const [editingSubCategoryCategory, setEditingSubCategoryCategory] = useState("");
  const [searchCategories, setSearchCategories] = useState("");
  const [searchSubCategories, setSearchSubCategories] = useState("");
  const [filterSubCategoryByCategory, setFilterSubCategoryByCategory] = useState("all");

  // Products
  const [products, setProducts] = useState<any[]>([]);
  const [newProduct, setNewProduct] = useState({
    name: "", subcategory: "", taxCodeType: null as 'hsn' | 'sac' | null,
    taxCodeValue: "", hsnCode: "", sacCode: "",
  });
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [searchProducts, setSearchProducts] = useState("");
  const [filterProductByCategory, setFilterProductByCategory] = useState("all");
  const [filterProductBySubCategory, setFilterProductBySubCategory] = useState("all");

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteData, setDeleteData] = useState<{
    type: 'category' | 'subcategory'; name: string; id?: string;
    impact: { subcategories?: string[]; products?: string[]; templates?: string[]; materials?: string[] };
  } | null>(null);

  // Template delete confirmation
  const [templateDeleteOpen, setTemplateDeleteOpen] = useState(false);
  const [templateDeleteTarget, setTemplateDeleteTarget] = useState<any>(null);
  const [templateDeleteImpact, setTemplateDeleteImpact] = useState<any>(null);
  const [templateDeleteLoading, setTemplateDeleteLoading] = useState(false);

  // Materials & Shops
  const [masterMaterials, setMasterMaterials] = useState<any[]>([]);
  const [localMaterials, setLocalMaterials] = useState<any[]>([]);
  const [localShops, setLocalShops] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [expandedShops, setExpandedShops] = useState<string[]>([]);
  const [masterSearch, setMasterSearch] = useState("");
  const [shopSearch, setShopSearch] = useState("");
  const [shopVendorCategoryFilter, setShopVendorCategoryFilter] = useState("all");
  const [materialSearch, setMaterialSearch] = useState("");
  const [materialCategoryFilter, setMaterialCategoryFilter] = useState("all");
  const [materialSubcategoryFilter, setMaterialSubcategoryFilter] = useState("all");
  const [showShopsList, setShowShopsList] = useState(false);
  const [showMaterialsList, setShowMaterialsList] = useState(false);
  const [vendorCategories, setVendorCategories] = useState<{ id: string; name: string }[]>([]);

  const [newMasterMaterial, setNewMasterMaterial] = useState<{
    name: string; code: string; vendorCategory: string;
    taxCodeType: 'hsn' | 'sac' | null; taxCodeValue: string;
  }>({ name: "", code: "", vendorCategory: "", taxCodeType: null, taxCodeValue: "" });

  const [selectedMasterId, setSelectedMasterId] = useState("");
  const [newMaterial, setNewMaterial] = useState<Partial<Material & {
    vendorCategory?: string; taxCodeType?: 'hsn' | 'sac'; taxCodeValue?: string;
  }>>({
    name: "", code: "", rate: 0, unit: "pcs", category: "", subCategory: "",
    product: "", brandName: "", modelNumber: "", technicalSpecification: "",
    dimensions: "", finish: "", metalType: "", vendorCategory: "",
    taxCodeType: undefined, taxCodeValue: "", shopId: "",
  });

  const [newShop, setNewShop] = useState<Partial<Shop>>({
    name: "", location: "", city: "", state: "", country: "", pincode: "",
    phoneCountryCode: "+91", contactNumber: "", gstNo: "", vendorCategory: "", rating: 5,
  });
  const [editingShopId, setEditingShopId] = useState<string | null>(null);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [supportMsg, setSupportMsg] = useState("");
  const [supportSenderName, setSupportSenderName] = useState("");
  const [supportSenderInfo, setSupportSenderInfo] = useState("");

  const mapProduct = (p: any) => ({
    ...p,
    taxCodeType: p.taxCodeType ?? p.tax_code_type ?? null,
    taxCodeValue: p.taxCodeValue ?? p.tax_code_value ?? "",
    hsnCode: p.hsn_code ?? p.hsnCode ?? "",
    sacCode: p.sac_code ?? p.sacCode ?? "",
  });

  // ── Tab State ─────────────────────────────────────────────────────────────
  const [, loc] = useLocation();
  const computeTab = () => {
    if (typeof window !== "undefined") {
      const t = new URLSearchParams(window.location.search).get("tab");
      if (t) return t;
    }
    return user?.role === "product_manager" ? "create-product" : "dashboard";
  };
  const [activeTab, setActiveTab] = useState<string>(computeTab());

  useEffect(() => { setActiveTab(computeTab()); }, [loc]);

  useEffect(() => {
    const update = () => setActiveTab(computeTab());
    window.addEventListener("popstate", update);
    const origPush = history.pushState;
    const origReplace = history.replaceState;
    (history as any).pushState = function (...args: any[]) {
      const r = origPush.apply(this, args);
      window.dispatchEvent(new PopStateEvent("popstate"));
      return r;
    };
    (history as any).replaceState = function (...args: any[]) {
      const r = origReplace.apply(this, args);
      window.dispatchEvent(new PopStateEvent("popstate"));
      return r;
    };
    update();
    return () => {
      window.removeEventListener("popstate", update);
      (history as any).pushState = origPush;
      (history as any).replaceState = origReplace;
    };
  }, []);

  // ── Data Loading ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/categories');
        if (r.ok) {
          const d = await r.json();
          setCategories((d.categories || []).sort((a: string, b: string) => a.localeCompare(b)));
        }
      } catch (e) { console.warn(e); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/subcategories-admin');
        if (r.ok) {
          const d = await r.json();
          setSubCategories((d.subcategories || []).sort((a: any, b: any) => (a.name || "").localeCompare(b.name || "")));
        }
      } catch (e) { console.warn(e); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/products');
        if (r.ok) {
          const d = await r.json();
          setProducts((d.products || []).map(mapProduct).sort((a: any, b: any) => (a.name || "").localeCompare(b.name || "")));
        }
      } catch (e) { console.warn(e); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/material-templates');
        if (r.ok) {
          const d = await r.json();
          setMasterMaterials(d?.templates || []);
        }
      } catch (e) { console.warn(e); }
    })();
  }, []);

  useEffect(() => { setLocalMaterials(materials || []); }, [materials]);
  useEffect(() => { setLocalShops(shops || []); }, [shops]);

  useEffect(() => {
    if (newMasterMaterial.name) {
      setNewMasterMaterial(prev => ({
        ...prev,
        code: prev.name.substring(0, 3).toUpperCase() + "-" + Math.floor(1000 + Math.random() * 9000),
      }));
    }
  }, [newMasterMaterial.name]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await apiFetch('/alerts');
        if (!res?.ok) { setAlerts([]); return; }
        const data = await res.json();
        if (cancelled) return;
        const list = data?.alerts || data || [];
        setAlerts((Array.isArray(list) ? list : []).map((r: any) => ({
          id: r.id?.toString?.() || String(r.id || ''),
          type: r.type,
          materialId: r.material_id || r.materialId || null,
          name: r.name || 'Material changed',
          oldRate: Number(r.old_rate ?? r.oldRate ?? 0),
          newRate: Number(r.new_rate ?? r.newRate ?? 0),
          editedBy: r.edited_by || r.editedBy || 'unknown',
          at: r.created_at || r.at || r.createdAt || null,
          shopId: r.shop_id || r.shopId || null,
          shopName: r.shop_name || r.shopName || null,
        })));
      } catch (e) { setAlerts([]); }
    };
    load();
    const iv = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(iv); };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await apiFetch("/api/vendor-categories");
        if (r.ok) {
          const d = await r.json();
          setVendorCategories(d.categories || []);
        }
      } catch (e) { console.error(e); }
    })();
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getSubCategoriesForCategory = (category: string) =>
    subCategories.filter((sc: any) => sc.category === category);

  const filteredShops = localShops.filter((s: any) => {
    if (shopSearch) {
      const q = shopSearch.toLowerCase();
      if (![(s.name || ""), (s.location || ""), (s.city || "")].some(v => v.toLowerCase().includes(q))) return false;
    }
    if (shopVendorCategoryFilter !== 'all' && (s.vendorCategory || "").trim().toLowerCase() !== shopVendorCategoryFilter.toLowerCase()) return false;
    return true;
  });

  const filteredMaterials = localMaterials.filter((m: any) => {
    if (materialSearch) {
      const q = materialSearch.toLowerCase();
      if (!(m.name || "").toLowerCase().includes(q) && !(m.code || "").toLowerCase().includes(q)) return false;
    }
    const inc = (field: string | undefined, val: string) => {
      if (!val || val === 'all') return true;
      if (!field) return val === 'uncategorized';
      if (val === 'uncategorized') return field === "";
      return field.split(",").map((s: string) => s.trim().toLowerCase()).includes(val.toLowerCase());
    };
    return inc(m.category, materialCategoryFilter) && inc(m.subcategory, materialSubcategoryFilter);
  });

  // ── Permissions ───────────────────────────────────────────────────────────
  const canViewSupportMessages = ['admin', 'software_team', 'purchase_team'].includes(user?.role || '');
  const canManageShops = ['admin', 'software_team', 'supplier', 'purchase_team'].includes(user?.role || '');
  const isAdminOrSoftwareTeam = ['admin', 'software_team'].includes(user?.role || '');
  const canViewCategories = ['admin', 'software_team', 'purchase_team', 'pre_sales', 'product_manager'].includes(user?.role || '');
  const canManageCategories = ['admin', 'software_team', 'purchase_team', 'pre_sales', 'product_manager'].includes(user?.role || '');
  const canCreateProduct = canManageCategories || user?.role === "pre_sales";
  const canManageProducts = canManageCategories || user?.role === "pre_sales";
  const canManageSubcategories = canManageCategories || user?.role === "pre_sales";
  const canEditDelete = ['admin', 'software_team', 'purchase_team'].includes(user?.role || '');
  const canApproveReject = ['admin', 'software_team', 'purchase_team'].includes(user?.role || '');
  const isProductManager = user?.role === 'product_manager';

  // ── Alert Handlers ────────────────────────────────────────────────────────
  const handleClearAllAlerts = async () => {
    try {
      const r = await apiFetch('/alerts', { method: 'DELETE' });
      if (r?.ok) setAlerts([]);
      else setAlerts([]);
    } catch (e) {
      setAlerts([]);
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    try {
      await apiFetch(`/alerts/${alertId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('dismiss alert failed', e);
    }
    setAlerts(prev => prev.filter((x: any) => x.id !== alertId));
  };

  // ── Category Handlers ─────────────────────────────────────────────────────
  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast({ title: "Error", description: "Category name is required", variant: "destructive" });
      return;
    }
    if (categories.includes(newCategory)) {
      toast({ title: "Error", description: "Already exists", variant: "destructive" });
      return;
    }
    try {
      await postJSON('/categories', { name: newCategory });
      setCategories(prev => [...prev, newCategory]);
      toast({ title: "Success", description: `Category "${newCategory}" created` });
      setNewCategory("");
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || 'Failed', variant: "destructive" });
    }
  };

  const handleSaveCategory = async () => {
    const n = editingCategoryValue.trim();
    if (!n) {
      toast({ title: 'Error', description: 'Name cannot be empty', variant: 'destructive' });
      return;
    }
    try {
      await apiFetch(`/categories/${encodeURIComponent(editingCategory!)}`, {
        method: 'PUT',
        body: JSON.stringify({ name: n }),
      });
      setCategories(prev => prev.map((c: string) => c === editingCategory ? n : c));
      setSubCategories(prev => prev.map((s: any) => s.category === editingCategory ? { ...s, category: n } : s));
      setEditingCategory(null);
      setEditingCategoryValue("");
      toast({ title: 'Success', description: 'Category updated' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update category', variant: 'destructive' });
    }
  };

  const requestDeleteCategory = async (cat: string) => {
    try {
      const r = await apiFetch(`/categories/${encodeURIComponent(cat)}/impact`);
      const impact = await r.json();
      setDeleteData({
        type: 'category', name: cat,
        impact: {
          subcategories: impact.subcategories || [],
          templates: impact.templates || [],
          materials: impact.materials || [],
          products: impact.products || [],
        },
      });
      setDeleteConfirmOpen(true);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to fetch impact', variant: 'destructive' });
    }
  };

  // ── Subcategory Handlers ──────────────────────────────────────────────────
  const handleAddSubCategory = async () => {
    if (!newSubCategory.trim()) {
      toast({ title: "Error", description: "Sub-category name required", variant: "destructive" });
      return;
    }
    if (!selectedCategoryForSubCategory) {
      toast({ title: "Error", description: "Select a category first", variant: "destructive" });
      return;
    }
    try {
      const res = await postJSON('/subcategories', { name: newSubCategory, category: selectedCategoryForSubCategory });
      setSubCategories(prev => [...prev, { id: res.subcategory.id, name: newSubCategory, category: selectedCategoryForSubCategory, createdAt: new Date().toISOString() }]);
      toast({ title: "Success", description: `Sub-category "${newSubCategory}" created` });
      setNewSubCategory("");
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || 'Failed', variant: "destructive" });
    }
  };

  const handleSaveSubCategory = async (subId: string) => {
    const n = editingSubCategoryName.trim();
    if (!n) {
      toast({ title: 'Error', description: 'Name cannot be empty', variant: 'destructive' });
      return;
    }
    if (!editingSubCategoryCategory) {
      toast({ title: 'Error', description: 'Select a category', variant: 'destructive' });
      return;
    }
    try {
      const r = await apiFetch(`/subcategories/${subId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: n, category: editingSubCategoryCategory }),
      });
      if (r.ok) {
        setSubCategories(prev => prev.map(s => s.id === subId ? { ...s, name: n, category: editingSubCategoryCategory } : s));
        setEditingSubCategoryId(null);
        setEditingSubCategoryName("");
        setEditingSubCategoryCategory("");
        toast({ title: 'Success', description: 'Subcategory updated' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update subcategory', variant: 'destructive' });
    }
  };

  const requestDeleteSubCategory = async (sub: any) => {
    try {
      const r = await apiFetch(`/subcategories/${sub.id}/impact`);
      const impact = await r.json();
      setDeleteData({
        type: 'subcategory', name: sub.name, id: sub.id,
        impact: { materials: impact.materials || [], products: impact.products || [] },
      });
      setDeleteConfirmOpen(true);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to fetch impact', variant: 'destructive' });
    }
  };

  const confirmDeleteAction = async () => {
    if (!deleteData) return;
    try {
      if (deleteData.type === 'category') {
        const cat = deleteData.name;
        await apiFetch(`/categories/${encodeURIComponent(cat)}`, { method: 'DELETE' });
        setCategories(prev => prev.filter(c => c !== cat));
        setSubCategories(prev => prev.filter(s => s.category !== cat));
        toast({ title: 'Deleted', description: `Category ${cat} removed` });
      } else {
        const id = deleteData.id!;
        const res = await apiFetch(`/subcategories/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setSubCategories(prev => prev.filter(s => s.id !== id));
          toast({ title: 'Deleted', description: `Subcategory ${deleteData.name} removed` });
        } else {
          toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
        }
      }
    } catch (err) {
      toast({ title: 'Error', description: `Failed to delete ${deleteData.type}`, variant: 'destructive' });
    } finally {
      setDeleteConfirmOpen(false);
      setDeleteData(null);
    }
  };

  // ── Product Handlers ──────────────────────────────────────────────────────
  const handleAddProduct = async () => {
    if (!newProduct.name.trim()) {
      toast({ title: "Error", description: "Product name required", variant: "destructive" });
      return;
    }
    if (!newProduct.subcategory) {
      toast({ title: "Error", description: "Subcategory required", variant: "destructive" });
      return;
    }
    try {
      const payload: any = { name: newProduct.name, subcategory: newProduct.subcategory };
      if (newProduct.hsnCode?.trim()) payload.hsn_code = newProduct.hsnCode.trim();
      if (newProduct.sacCode?.trim()) payload.sac_code = newProduct.sacCode.trim();
      const res = await postJSON('/products', payload);
      setProducts(prev => [...prev, mapProduct(res.product || res)]);
      toast({ title: "Success", description: `Product "${newProduct.name}" created` });
      setNewProduct({ name: "", subcategory: "", taxCodeType: null, taxCodeValue: "", hsnCode: "", sacCode: "" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || 'Failed', variant: "destructive" });
    }
  };

  const handleCloneProduct = (product: any) => {
    setNewProduct({
      name: `${product.name} (Copy)`,
      subcategory: product.subcategory || "",
      taxCodeType: product.taxCodeType || null,
      taxCodeValue: product.taxCodeValue || "",
      hsnCode: product.hsn_code || product.hsnCode || "",
      sacCode: product.sac_code || product.sacCode || "",
    });
    setShowAddProductDialog(true);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct?.name?.trim()) {
      toast({ title: "Error", description: "Product name required", variant: "destructive" });
      return;
    }
    if (!editingProduct?.subcategory) {
      toast({ title: "Error", description: "Subcategory required", variant: "destructive" });
      return;
    }
    try {
      const payload: any = { name: editingProduct.name, subcategory: editingProduct.subcategory };
      if (editingProduct.taxCodeType) payload.taxCodeType = editingProduct.taxCodeType;
      if (editingProduct.taxCodeValue) payload.taxCodeValue = editingProduct.taxCodeValue;
      if (editingProduct.hsnCode !== undefined) payload.hsn_code = editingProduct.hsnCode;
      if (editingProduct.sacCode !== undefined) payload.sac_code = editingProduct.sacCode;
      const res = await apiFetch(`/products/${editingProduct.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      const updated = await res.json();
      setProducts(prev => prev.map((p: any) => p.id === editingProduct.id ? mapProduct(updated.product || updated) : p));
      toast({ title: "Success", description: `Product "${editingProduct.name}" updated` });
      setEditingProduct(null);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || 'Failed', variant: "destructive" });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await apiFetch(`/products/${productId}`, { method: 'DELETE' });
      setProducts(prev => prev.filter((p: any) => p.id !== productId));
      toast({ title: "Success", description: 'Product deleted' });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || 'Failed', variant: "destructive" });
    }
  };

  // ── Master Material Handlers ──────────────────────────────────────────────
  const handleAddMasterMaterial = async () => {
    if (!newMasterMaterial.name.trim()) {
      toast({ title: "Error", description: "Material Name required", variant: "destructive" });
      return;
    }
    try {
      const res = await postJSON('/material-templates', {
        name: newMasterMaterial.name.trim(),
        code: newMasterMaterial.code,
        vendorCategory: newMasterMaterial.vendorCategory.trim(),
        taxCodeType: newMasterMaterial.taxCodeType,
        taxCodeValue: newMasterMaterial.taxCodeValue.trim(),
      });
      setMasterMaterials(prev => [...prev, res.template || res]);
      toast({ title: "Success", description: "Master material created." });
      setNewMasterMaterial({ name: "", code: "", vendorCategory: "", taxCodeType: null, taxCodeValue: "" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || 'Failed', variant: "destructive" });
    }
  };

  const handleCloneMasterMaterial = (template: any) => {
    setNewMasterMaterial({
      name: `${template.name} (Copy)`,
      code: "",
      vendorCategory: template.vendor_category || "",
      taxCodeType: template.tax_code_type || null,
      taxCodeValue: template.tax_code_value || "",
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast({ title: "Template Cloned", description: "Form pre-filled. A new code will be generated automatically." });
  };

  const handleSaveMasterMaterial = async (template: any) => {
    if (!(newMaterial.name || "").trim()) {
      toast({ title: 'Error', description: 'Name required', variant: 'destructive' });
      return;
    }
    if (newMaterial.taxCodeType && !newMaterial.taxCodeValue?.trim()) {
      toast({ title: 'Error', description: 'Tax code value required', variant: 'destructive' });
      return;
    }
    try {
      const res = await apiFetch(`/material-templates/${template.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: newMaterial.name,
          code: template.code,
          vendor_category: newMaterial.vendorCategory || null,
          tax_code_type: newMaterial.taxCodeType || null,
          tax_code_value: newMaterial.taxCodeValue || null,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        toast({ title: 'Error', description: text || 'Server error', variant: 'destructive' });
        return;
      }
      const data = await res.json().catch(() => null);
      setMasterMaterials(prev => prev.map(m => m.id === template.id ? {
        ...m,
        name: newMaterial.name,
        vendor_category: newMaterial.vendorCategory,
        tax_code_type: newMaterial.taxCodeType,
        tax_code_value: newMaterial.taxCodeValue,
        ...(data?.template || {}),
      } : m));
      setEditingMaterialId(null);
      toast({ title: 'Success', description: 'Template updated' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update template', variant: 'destructive' });
    }
  };

  const handleDeleteMasterMaterial = async (template: any) => {
    // Fetch impact before showing confirmation
    setTemplateDeleteTarget(template);
    setTemplateDeleteLoading(true);
    setTemplateDeleteOpen(true);
    try {
      const r = await apiFetch(`/material-templates/${template.id}/impact`);
      if (r.ok) {
        const data = await r.json();
        setTemplateDeleteImpact(data);
      } else {
        setTemplateDeleteImpact({ linkedMaterials: [], orphanedMaterials: [], submissions: [], totalAffected: 0 });
      }
    } catch {
      setTemplateDeleteImpact({ linkedMaterials: [], orphanedMaterials: [], submissions: [], totalAffected: 0 });
    } finally {
      setTemplateDeleteLoading(false);
    }
  };

  const confirmDeleteMasterMaterial = async () => {
    if (!templateDeleteTarget) return;
    try {
      const res = await apiFetch(`/material-templates/${templateDeleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Failed to delete');
      }
      setMasterMaterials(prev => prev.filter(m => m.id !== templateDeleteTarget.id));
      toast({ title: 'Deleted', description: `"${templateDeleteTarget.name}" and all linked materials removed` });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally {
      setTemplateDeleteOpen(false);
      setTemplateDeleteTarget(null);
      setTemplateDeleteImpact(null);
    }
  };

  // ── Material Handlers ─────────────────────────────────────────────────────
  const handleSelectMasterMaterial = (masterId: string) => {
    const selected = masterMaterials.find((m: any) => m.id === masterId);
    if (selected) {
      setSelectedMasterId(masterId);
      setNewMaterial({ ...newMaterial, name: selected.name, code: selected.code });
    }
  };

  const handleAddMaterial = () => {
    if (!newMaterial.name || !newMaterial.rate || !newMaterial.category || !newMaterial.subCategory || !newMaterial.product) {
      toast({ title: "Error", description: "Name, Rate, Category, Sub Category, and Product are required", variant: "destructive" });
      return;
    }
    let shopId = newMaterial.shopId || "";
    if (user?.role === "supplier" && user.shopId) shopId = user.shopId;
    if (!shopId || shopId === "1") {
      if (localShops.length > 0) shopId = localShops[0].id;
      else {
        toast({ title: "Setup Required", description: "Create at least one shop first.", variant: "destructive" });
        return;
      }
    }
    (async () => {
      try { await submitMaterialForApproval({ ...newMaterial, shopId }); } catch (err) { console.error(err); }
    })();
    toast({ title: "Success", description: "Material submitted for approval." });
    setNewMaterial({ name: "", code: "", rate: 0, unit: "pcs", category: "", subCategory: "", product: "", brandName: "", modelNumber: "", technicalSpecification: "", shopId: "", dimensions: "", finish: "", metalType: "" });
    setSelectedMasterId("");
  };

  const handleEditMaterial = (mat: any) => {
    setEditingMaterialId(mat.id);
    setNewMaterial({
      name: mat.name || "",
      code: mat.code || "",
      rate: mat.rate || 0,
      unit: mat.unit || "pcs",
      category: mat.category || "",
      subCategory: mat.subcategory || mat.sub_category || mat.subCategory || "",
      product: mat.product || "",
      brandName: mat.brandname || mat.brandName || "",
      modelNumber: mat.modelnumber || mat.modelNumber || "",
      technicalSpecification: mat.technicalspecification || mat.technicalSpecification || "",
      dimensions: mat.dimensions || "",
      finish: mat.finish || mat.finishtype || "",
      metalType: mat.metaltype || mat.metalType || "",
      shopId: mat.shop_id ? mat.shop_id.toString() : (mat.shopId ? mat.shopId.toString() : ""),
    });
  };

  const handleUpdateMaterial = async () => {
    if (!editingMaterialId) return;
    const prevMat = localMaterials.find((m: any) => m.id === editingMaterialId);
    const oldRate = prevMat?.rate ?? null;
    const newRate = newMaterial.rate ?? null;
    const rateChanged = oldRate != null && newRate != null && Number(oldRate) !== Number(newRate);
    try {
      const payload: any = {};
      if (newMaterial.name !== undefined) payload.name = newMaterial.name;
      if (newMaterial.code !== undefined) payload.code = newMaterial.code;
      if (newMaterial.rate !== undefined) payload.rate = newMaterial.rate;
      if (newMaterial.shopId !== undefined) payload.shop_id = newMaterial.shopId === "" ? null : newMaterial.shopId;
      if (newMaterial.unit !== undefined) payload.unit = newMaterial.unit;
      if (newMaterial.category !== undefined) payload.category = newMaterial.category;
      if (newMaterial.brandName !== undefined) payload.brandname = newMaterial.brandName;
      if (newMaterial.modelNumber !== undefined) payload.modelnumber = newMaterial.modelNumber;
      if (newMaterial.subCategory !== undefined) payload.subcategory = newMaterial.subCategory;
      if (newMaterial.product !== undefined) payload.product = newMaterial.product;
      if (newMaterial.technicalSpecification !== undefined) payload.technicalspecification = newMaterial.technicalSpecification;

      try {
        const res = await apiFetch(`/materials/${editingMaterialId}`, { method: 'PUT', body: JSON.stringify(payload) });
        if (res.ok) {
          const data = await res.json();
          const u = data?.material || data;
          setLocalMaterials(prev => prev.map((m: any) => m.id === editingMaterialId ? {
            ...m, ...u,
            shopId: u.shop_id || u.shopId,
            brandName: u.brandname || u.brandName || "",
            modelNumber: u.modelnumber || u.modelNumber || "",
            subCategory: u.subcategory || u.subCategory || "",
            technicalSpecification: u.technicalspecification || u.technicalSpecification || "",
          } : m));
        } else {
          setLocalMaterials(prev => prev.map((m: any) => m.id === editingMaterialId ? { ...m, ...newMaterial } : m));
        }
      } catch (e) {
        setLocalMaterials(prev => prev.map((m: any) => m.id === editingMaterialId ? { ...m, ...newMaterial } : m));
      }

      if (rateChanged) {
        const shopId = prevMat?.shop_id || prevMat?.shopId || newMaterial.shopId || null;
        const shopName = (shopId ? (localShops.find((s: any) => String(s.id) === String(shopId))?.name) : null) || prevMat?.shop_name || null;
        const alert = {
          type: 'material-rate-edit',
          materialId: editingMaterialId,
          name: newMaterial.name || prevMat?.name || "",
          oldRate, newRate,
          editedBy: user?.username || user?.name || 'unknown',
          at: new Date().toISOString(),
          shopId, shopName,
        };
        try {
          const c = await postJSON('/alerts', alert);
          const a = c?.alert || c;
          setAlerts(prev => [{
            id: a.id?.toString?.() || String(Date.now()),
            type: a.type || alert.type,
            materialId: a.material_id || alert.materialId,
            name: a.name || alert.name,
            oldRate: Number(a.old_rate ?? alert.oldRate),
            newRate: Number(a.new_rate ?? alert.newRate),
            editedBy: a.edited_by || alert.editedBy,
            at: a.created_at || alert.at,
            shopId: a.shop_id || alert.shopId,
            shopName: a.shop_name || alert.shopName,
          }, ...prev]);
        } catch (e) {
          setAlerts(prev => [{ id: Date.now().toString(), ...alert }, ...prev]);
        }
      }

      toast({ title: 'Updated', description: 'Material details updated' });
      setEditingMaterialId(null);
      setNewMaterial({ name: '', code: '', rate: 0, unit: 'pcs', category: '', subCategory: '', product: '', brandName: '', modelNumber: '', technicalSpecification: '', dimensions: '', finish: '', metalType: '' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update material', variant: 'destructive' });
    }
  };

  const handleDeleteMaterial = async (mat: any) => {
    if (!window.confirm(`Delete material "${mat.name}"?`)) return;
    try {
      await deleteMaterial(mat.id);
      setLocalMaterials(prev => prev.filter((p: any) => p.id !== mat.id));
      toast({ title: 'Deleted', description: `${mat.name} removed` });
    } catch (err) {
      toast({ title: 'Error', description: `Failed to delete ${mat.name}`, variant: 'destructive' });
    }
  };

  // ── Shop Handlers ─────────────────────────────────────────────────────────
  const handleAddShop = () => {
    if (!newShop.name || !newShop.phoneCountryCode || !newShop.city || !newShop.state || !newShop.country || !newShop.pincode) {
      toast({ title: "Error", description: "All fields required (GST optional)", variant: "destructive" });
      return;
    }
    (async () => {
      try {
        let created: any = null;
        if (typeof submitShopForApproval === 'function') created = await submitShopForApproval({ ...newShop });
        if (created?.id) {
          setShopRequests((prev: any[]) => [{
            id: created.id, shop: created,
            submittedBy: user?.name, submittedAt: new Date().toISOString(), status: "pending",
          }, ...prev]);
          setActiveTab('approvals');
          toast({ title: "Success", description: "Shop submitted for approval" });
        } else {
          setShopRequests((prev: any[]) => [{
            id: Math.random().toString(), shop: { ...newShop },
            submittedBy: user?.name, submittedAt: new Date().toISOString(), status: "pending",
          }, ...prev]);
          setActiveTab('approvals');
          toast({ title: "Saved Locally", description: "Shop saved locally" });
        }
      } catch (err: any) {
        const msg = err?.message || String(err);
        setShopRequests((prev: any[]) => [{
          id: Math.random().toString(), shop: { ...newShop },
          submittedBy: user?.name, submittedAt: new Date().toISOString(), status: "pending",
        }, ...prev]);
        setActiveTab('approvals');
        toast({
          title: msg.includes('401') || /unauthori/i.test(msg) ? "Saved Locally (Unauthorized)" : "Saved Locally",
          description: msg.includes('401') ? "Not logged in as admin" : "Server submit failed",
          variant: 'destructive',
        });
      } finally {
        setNewShop({ name: "", location: "", city: "", phoneCountryCode: "+91", contactNumber: "", state: "", country: "", pincode: "", gstNo: "", vendorCategory: "" });
        setEditingShopId(null);
      }
    })();
  };

  const handleEditShop = (shop: any) => {
    setEditingShopId(shop.id);
    setNewShop({
      name: shop.name || "",
      location: shop.location || "",
      city: shop.city || "",
      state: shop.state || "",
      country: shop.country || "",
      pincode: shop.pincode || "",
      phoneCountryCode: shop.phone_country_code || shop.phoneCountryCode || "+91",
      contactNumber: shop.contact_number || shop.contactNumber || "",
      gstNo: shop.gst_no || shop.gstNo || "",
      vendorCategory: shop.vendor_category || shop.vendorCategory || "",
      rating: shop.rating || 5,
    });
  };

  const handleUpdateShop = async () => {
    if (!editingShopId) return;
    try {
      const res = await apiFetch(`/api/shops/${editingShopId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newShop),
      });
      if (!res.ok) throw new Error(`Update failed: ${res.status}`);
      setLocalShops(prev => prev.map((s: any) => s.id === editingShopId ? { ...s, ...newShop } : s));
      toast({ title: 'Updated', description: 'Shop details updated' });
      setEditingShopId(null);
      setNewShop({ name: '', location: '', city: '', phoneCountryCode: '+91', state: '', country: '', pincode: '', gstNo: '' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update shop', variant: 'destructive' });
    }
  };

  const handleDeleteShop = async (shop: any) => {
    if (!window.confirm(`Delete shop "${shop.name}"?`)) return;
    try {
      await deleteShop(shop.id);
      setLocalShops(prev => prev.filter((p: any) => p.id !== shop.id));
      toast({ title: 'Deleted', description: `${shop.name} removed` });
    } catch (err) {
      toast({ title: 'Error', description: `Failed to delete ${shop.name}`, variant: 'destructive' });
    }
  };

  const handleApproveShop = async (request: any) => {
    try {
      const shopId = request?.shop?.id || request?.id;
      if (!shopId) {
        toast({ title: "Cannot Approve", description: "Not submitted to server yet.", variant: 'destructive' });
        return;
      }
      await approveShop?.(shopId);
      setShopRequests((prev: any[]) => prev.filter((r: any) => r.id !== request.id));
      toast({ title: "Approved", description: "Shop approved" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to approve shop", variant: "destructive" });
    }
  };

  const handleRejectShop = async (request: any) => {
    if (!rejectReason.trim()) {
      toast({ title: "Error", description: "Provide a rejection reason", variant: "destructive" });
      return;
    }
    try {
      const shopId = request?.shop?.id || request?.id;
      if (!shopId) {
        setShopRequests((prev: any[]) => prev.filter((r: any) => r.id !== request.id));
        setRejectingId(null);
        setRejectReason("");
        toast({ title: "Removed", description: "Local shop request removed" });
        return;
      }
      await rejectShop?.(shopId, rejectReason);
      setShopRequests((prev: any[]) => prev.filter((r: any) => r.id !== request.id && r?.shop?.id !== shopId));
      setRejectingId(null);
      setRejectReason("");
      toast({ title: "Rejected", description: "Shop rejected" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to reject shop", variant: "destructive" });
    }
  };

  const handleApproveMaterial = async (requestId: string) => {
    try {
      const req = materialRequests.find((r: any) => r.id === requestId);
      await approveMaterial?.(requestId, req?.source);
      toast({ title: "Approved", description: "Material approved" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to approve material", variant: "destructive" });
    }
  };

  const handleRejectMaterial = async (requestId: string) => {
    try {
      const req = materialRequests.find((r: any) => r.id === requestId);
      await rejectMaterial?.(requestId, rejectReason, req?.source);
      setRejectingId(null);
      setRejectReason("");
      toast({ title: "Rejected", description: "Material rejected" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to reject material", variant: "destructive" });
    }
  };

  const handleSupportSubmit = () => {
    if (!supportMsg || !supportSenderName) {
      toast({ title: "Error", description: "Sender name and message required", variant: "destructive" });
      return;
    }
    (async () => {
      try {
        await addSupportMessage?.(supportSenderName, supportMsg, supportSenderInfo);
        toast({ title: "Request Sent", description: "Message sent to Admin & Software Team." });
        setSupportMsg("");
        setSupportSenderName("");
        setSupportSenderInfo("");
      } catch (err) {
        toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
      }
    })();
  };

  const handleDeleteMessage = async (msgId: string) => {
    try {
      await deleteMessage?.(msgId);
      toast({ title: "Success", description: "Message deleted" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete message", variant: "destructive" });
    }
  };

  // ── Tab switcher ──────────────────────────────────────────────────────────
  const switchTab = (val: string) => {
    setActiveTab(val);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", val);
      window.history.replaceState({}, "", url.toString());
    }
  };

  // ── Impact Badge Helper ───────────────────────────────────────────────────
  const ImpactBadges = ({ items, cls }: { items?: string[]; cls: string }) => {
    const valid = (items || []).filter(s => s?.trim());
    if (!valid.length) return null;
    return (
      <div className="text-sm flex flex-wrap gap-1">
        {valid.slice(0, 10).map((s, i) => (
          <Badge key={i} variant="secondary" className={cls}>{s}</Badge>
        ))}
        {valid.length > 10 && <span className="text-xs text-muted-foreground pt-1">...and more</span>}
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-heading">
            {user?.role === "supplier"
              ? "Supplier Portal"
              : user?.role === "purchase_team"
                ? "Purchase Team Dashboard"
                : "Admin Dashboard"}
          </h2>
          <p className="text-muted-foreground">Manage your inventory and settings</p>
        </div>

        {/* ── Dashboard Tab ─────────────────────────────────────────────── */}
        {activeTab === "dashboard" && !isProductManager && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Shops</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{shops.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Materials</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{materials.length}</div>
                </CardContent>
              </Card>
            </div>

            {(isAdminOrSoftwareTeam || user?.role === "purchase_team") && (
              <div className="space-y-4 mt-4">
                {/* Shops List */}
                <Card>
                  <CardHeader className="cursor-pointer select-none" onClick={() => setShowShopsList(!showShopsList)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="font-bold text-lg flex items-center gap-2">
                          All Shops {showShopsList ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </CardTitle>
                        <CardDescription>List of registered shops</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  {showShopsList && (
                    <CardContent className="space-y-4">
                      <div className="flex flex-col md:flex-row items-center gap-3">
                        <div className="relative flex-1">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input value={shopSearch} onChange={e => setShopSearch(e.target.value)} placeholder="Search shops..." className="h-10 pl-9" />
                        </div>
                        <Select value={shopVendorCategoryFilter} onValueChange={setShopVendorCategoryFilter}>
                          <SelectTrigger className="w-full md:w-[220px] h-10">
                            <SelectValue placeholder="All Vendor Categories" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            <SelectItem value="all">All Vendor Categories</SelectItem>
                            {vendorCategories.map((vc: any) => (
                              <SelectItem key={vc.id} value={vc.name}>{vc.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="max-h-[800px] overflow-y-auto pr-2 border rounded-md">
                        {filteredShops.length === 0 ? (
                          <p className="text-muted-foreground p-3">No shops available</p>
                        ) : filteredShops.map((shop: any) => (
                          <div key={shop.id} className="p-3 border-b hover:bg-muted/30 transition-colors">
                            {editingShopId === shop.id ? (
                              <div className="space-y-4 p-2 bg-muted/20 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {[["Shop Name", "name"], ["Location", "location"], ["City", "city"], ["GST No", "gstNo"]].map(([label, field]) => (
                                    <div key={field}>
                                      <Label className="text-xs font-semibold">{label}</Label>
                                      <Input
                                        value={(newShop as any)[field] || ''}
                                        onChange={e => setNewShop({ ...newShop, [field]: e.target.value })}
                                        placeholder={label}
                                      />
                                    </div>
                                  ))}
                                  <div>
                                    <Label className="text-xs font-semibold">Contact Number</Label>
                                    <Input value={newShop.contactNumber || ''} onChange={e => setNewShop({ ...newShop, contactNumber: e.target.value })} placeholder="Phone Number" />
                                  </div>
                                  <div>
                                    <Label className="text-xs font-semibold">Vendor Category</Label>
                                    <Select value={newShop.vendorCategory || ''} onValueChange={v => setNewShop({ ...newShop, vendorCategory: v })}>
                                      <SelectTrigger><SelectValue placeholder="Select Vendor Category" /></SelectTrigger>
                                      <SelectContent className="max-h-60">
                                        {vendorCategories.map((vc: any) => (
                                          <SelectItem key={vc.id} value={vc.name}>{vc.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={handleUpdateShop}>Save Changes</Button>
                                  <Button size="sm" variant="ghost" onClick={() => {
                                    setEditingShopId(null);
                                    setNewShop({ name: '', location: '', city: '', phoneCountryCode: '+91', state: '', country: '', pincode: '', gstNo: '' });
                                  }}>Cancel</Button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-start gap-3">
                                    <button
                                      onClick={() => setExpandedShops(prev =>
                                        prev.includes(shop.id) ? prev.filter(id => id !== shop.id) : [...prev, shop.id]
                                      )}
                                      className="p-1 mt-1"
                                    >
                                      {expandedShops.includes(shop.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </button>
                                    <div>
                                      <div className="font-bold text-lg">{shop.name}</div>
                                      <div className="text-sm text-foreground/80">{shop.location}, {shop.city}</div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {shop.phone_country_code || shop.phoneCountryCode || '+91'} {shop.contact_number || shop.contactNumber || ''} • {shop.gst_no || shop.gstNo || 'No GST'}
                                      </div>
                                    </div>
                                  </div>
                                  {canEditDelete && (
                                    <div className="flex items-center gap-2">
                                      <Button size="sm" variant="outline" onClick={() => handleEditShop(shop)}>Edit</Button>
                                      <Button size="sm" variant="ghost" onClick={() =>
                                        setLocalShops(prev => prev.map((s: any) => s.id === shop.id ? { ...s, disabled: !s.disabled } : s))
                                      }>
                                        {shop.disabled ? 'Enable' : 'Disable'}
                                      </Button>
                                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteShop(shop)}>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                {expandedShops.includes(shop.id) && (
                                  <div className="mt-2 pl-10">
                                    {localMaterials.filter((m: any) => String(m.shopId) === String(shop.id)).length === 0 ? (
                                      <div className="text-sm text-muted-foreground">No materials for this shop</div>
                                    ) : localMaterials.filter((m: any) => String(m.shopId) === String(shop.id)).map((mat: any) => (
                                      <div key={mat.id} className="flex items-center justify-between py-1">
                                        <div className="text-sm font-medium">{mat.name} <span className="text-xs text-muted-foreground ml-2">{mat.code || ''}</span></div>
                                        <div className="text-sm">₹{Number(mat.rate || 0).toLocaleString()}</div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* Materials List */}
                <Card>
                  <CardHeader className="cursor-pointer select-none" onClick={() => setShowMaterialsList(!showMaterialsList)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="font-bold text-lg flex items-center gap-2">
                          All Materials {showMaterialsList ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </CardTitle>
                        <CardDescription>Comprehensive material registry</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  {showMaterialsList && (
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input value={materialSearch} onChange={e => setMaterialSearch(e.target.value)} placeholder="Search materials..." className="h-9 w-full max-w-[360px]" />
                        <div className="flex items-center gap-2 ml-auto">
                          <Select value={materialCategoryFilter} onValueChange={val => { setMaterialCategoryFilter(val); setMaterialSubcategoryFilter('all'); }}>
                            <SelectTrigger className="h-9 w-44"><SelectValue placeholder="All Categories" /></SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              <SelectItem value="all">All Categories</SelectItem>
                              <SelectItem value="uncategorized" className="text-destructive italic">Uncategorized</SelectItem>
                              {categories?.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Select value={materialSubcategoryFilter} onValueChange={setMaterialSubcategoryFilter} disabled={materialCategoryFilter === 'all'}>
                            <SelectTrigger className="h-9 w-44"><SelectValue placeholder="All Subcategories" /></SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              <SelectItem value="all">All Subcategories</SelectItem>
                              <SelectItem value="uncategorized" className="text-destructive italic">Uncategorized</SelectItem>
                              {materialCategoryFilter !== 'all' && materialCategoryFilter !== 'uncategorized' &&
                                getSubCategoriesForCategory(materialCategoryFilter).map((sub: any) => (
                                  <SelectItem key={sub.id || sub.name} value={sub.name}>{sub.name}</SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="max-h-[800px] overflow-y-auto pr-2 border rounded-md">
                        {filteredMaterials.length === 0 ? (
                          <p className="text-muted-foreground p-3">No materials available</p>
                        ) : filteredMaterials.map((mat: any) => (
                          <div key={mat.id} className="p-2 border-b">
                            {editingMaterialId === mat.id ? (
                              <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
                                <div className="font-bold text-base pb-2 border-b">Editing: {mat.name}</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div><Label>Name</Label><Input value={newMaterial.name || ''} onChange={e => setNewMaterial({ ...newMaterial, name: e.target.value })} /></div>
                                  <div><Label>Code</Label><Input value={newMaterial.code || ''} onChange={e => setNewMaterial({ ...newMaterial, code: e.target.value })} /></div>
                                  <div><Label>Rate</Label><Input type="number" value={newMaterial.rate || ''} onChange={e => setNewMaterial({ ...newMaterial, rate: parseFloat(e.target.value) || 0 })} /></div>
                                  <div>
                                    <Label>Unit</Label>
                                    <Select value={newMaterial.unit || ''} onValueChange={v => setNewMaterial({ ...newMaterial, unit: v })}>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent className="max-h-60">
                                        {UNIT_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>Category</Label>
                                    <Select value={newMaterial.category || ''} onValueChange={v => setNewMaterial({ ...newMaterial, category: v, subCategory: '' })}>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent className="max-h-60">
                                        {categories.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>Sub Category</Label>
                                    <Select value={newMaterial.subCategory || ''} onValueChange={v => setNewMaterial({ ...newMaterial, subCategory: v })}>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent className="max-h-60">
                                        {getSubCategoriesForCategory(newMaterial.category || '').map((sc: any) => (
                                          <SelectItem key={sc.id} value={sc.name}>{sc.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>Product</Label>
                                    <Select value={newMaterial.product || ''} onValueChange={v => setNewMaterial({ ...newMaterial, product: v })}>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent className="max-h-60">
                                        {products.filter((p: any) => p.subcategory === newMaterial.subCategory).map((p: any) => (
                                          <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div><Label>Brand Name</Label><Input value={newMaterial.brandName || ''} onChange={e => setNewMaterial({ ...newMaterial, brandName: e.target.value })} /></div>
                                  <div><Label>Model Number</Label><Input value={newMaterial.modelNumber || ''} onChange={e => setNewMaterial({ ...newMaterial, modelNumber: e.target.value })} /></div>
                                  <div>
                                    <Label>Assigned Shop</Label>
                                    <Select value={newMaterial.shopId || ''} onValueChange={v => setNewMaterial({ ...newMaterial, shopId: v })}>
                                      <SelectTrigger><SelectValue placeholder="Select Shop" /></SelectTrigger>
                                      <SelectContent className="max-h-60">
                                        {localShops.map((s: any) => (
                                          <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div>
                                  <Label>Technical Specification</Label>
                                  <Textarea value={newMaterial.technicalSpecification || ''} onChange={e => setNewMaterial({ ...newMaterial, technicalSpecification: e.target.value })} />
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={handleUpdateMaterial}>Save Changes</Button>
                                  <Button size="sm" variant="ghost" onClick={() => {
                                    setEditingMaterialId(null);
                                    setNewMaterial({ name: '', code: '', rate: 0, unit: 'pcs', category: '', subCategory: '', product: '', brandName: '', modelNumber: '', technicalSpecification: '', dimensions: '', finish: '', metalType: '' });
                                  }}>Cancel</Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-bold text-base">{mat.name}</div>
                                  <div className="text-xs text-muted-foreground">{mat.code} • ₹{mat.rate}/{mat.unit}</div>
                                  <div className="text-[10px] text-muted-foreground italic">
                                    Shop: {localShops.find(s => s.id === (mat.shopId || mat.shop_id))?.name || 'Unassigned'}
                                  </div>
                                  {(mat.technicalSpecification || mat.technicalspecification) && (
                                    <div className="text-[10px] text-blue-600 mt-1 line-clamp-2 max-w-md">
                                      Spec: {mat.technicalSpecification || mat.technicalspecification}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="ghost" onClick={() =>
                                    setLocalMaterials(prev => prev.map((m: any) => m.id === mat.id ? { ...m, disabled: !m.disabled } : m))
                                  }>
                                    {mat.disabled ? 'Enable' : 'Disable'}
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleEditMaterial(mat)}>Edit</Button>
                                  {canEditDelete && (
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteMaterial(mat)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>
            )}

            {user?.role === 'supplier' && (
              <Card>
                <CardHeader><CardTitle>Available Materials</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-3">
                    <Input value={masterSearch} onChange={e => setMasterSearch(e.target.value)} placeholder="Search templates..." />
                  </div>
                  {masterMaterials.length === 0 ? (
                    <p className="text-muted-foreground">No master materials yet</p>
                  ) : (
                    <div className="space-y-2">
                      {masterMaterials.map((mm: any) => (
                        <div key={mm.id} className="p-2 border-b flex items-center justify-between">
                          <div className="text-sm">{mm.name} <span className="text-xs text-muted-foreground ml-2">{mm.code}</span></div>
                          <Link href="/admin/dashboard?tab=materials"><span className="text-sm text-sidebar-primary">Use</span></Link>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── Alerts Tab ────────────────────────────────────────────────── */}
        {activeTab === 'alerts' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Alerts</CardTitle>
                  <CardDescription>Recent material rate edits</CardDescription>
                </div>
                <Button size="sm" variant="ghost" onClick={handleClearAllAlerts}>Clear All</Button>
              </div>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <p className="text-muted-foreground">No alerts</p>
              ) : (
                <div className="space-y-2">
                  {alerts.map((a: any) => (
                    <div key={a.id} className="p-3 border rounded flex items-start justify-between">
                      <div>
                        <div className="font-medium">{a.name || 'Material changed'}</div>
                        {a.shopName && <div className="text-sm text-muted-foreground">Shop: {a.shopName}</div>}
                        <div className="text-sm text-muted-foreground">
                          Rate: <span className="line-through">₹{Number(a.oldRate || 0).toLocaleString()}</span>
                          {' → '}
                          <span className="font-semibold">₹{Number(a.newRate || 0).toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          By {a.editedBy || 'unknown'} • {a.at ? new Date(a.at).toLocaleString() : 'Unknown'}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => handleDismissAlert(a.id)}>Dismiss</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={switchTab} className="w-full">

          {/* ── Create Product Tab ── */}
          {canViewCategories && (
            <TabsContent value="create-product" className="space-y-6 mt-4">

              {/* Categories */}
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-purple-900">Create Categories</CardTitle>
                      <CardDescription className="text-purple-800">Add new product categories</CardDescription>
                    </div>
                    {canCreateProduct && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="bg-purple-600 hover:bg-purple-700"><Plus className="h-4 w-4 mr-2" />Add Category</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Add New Category</DialogTitle></DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Category Name <Required /></Label>
                              <Input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="e.g. Flooring, Roofing" />
                            </div>
                            <Button onClick={handleAddCategory} className="w-full bg-purple-600 hover:bg-purple-700">
                              <Plus className="h-4 w-4 mr-2" />Add Category
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Input value={searchCategories} onChange={e => setSearchCategories(e.target.value)} placeholder="Search categories..." />
                  </div>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {categories.length === 0 ? (
                      <p className="text-center text-muted-foreground py-6">No categories created yet</p>
                    ) : categories
                      .filter(cat => cat.toLowerCase().includes(searchCategories.toLowerCase()))
                      .map((cat: string, idx: number) => {
                        const subCats = getSubCategoriesForCategory(cat);
                        return (
                          <div key={idx} className="p-4 border rounded-lg bg-white hover:border-purple-400 transition">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Package className="h-5 w-5 text-purple-600" />
                                <div>
                                  <span className="font-medium">{cat}</span>
                                  {subCats.length > 0 && <span className="text-sm text-muted-foreground ml-2">({subCats.length} subcategories)</span>}
                                </div>
                              </div>
                              {canManageCategories && (
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => { setEditingCategory(cat); setEditingCategoryValue(cat); }}>Edit</Button>
                                  <Button size="sm" variant="destructive" onClick={() => requestDeleteCategory(cat)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                              )}
                            </div>
                            {editingCategory === cat && (
                              <div className="mt-3 p-3 bg-gray-100 rounded border">
                                <div className="flex gap-2">
                                  <Input value={editingCategoryValue} onChange={e => setEditingCategoryValue(e.target.value)} placeholder="Category name" className="text-sm" />
                                  <Button size="sm" onClick={handleSaveCategory}>Save</Button>
                                  <Button size="sm" variant="ghost" onClick={() => { setEditingCategory(null); setEditingCategoryValue(""); }}>Cancel</Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>

              {/* Subcategories */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-green-900">Create Subcategories</CardTitle>
                      <CardDescription className="text-green-800">Add subcategories to your categories</CardDescription>
                    </div>
                    {canCreateProduct && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="bg-green-600 hover:bg-green-700"><Plus className="h-4 w-4 mr-2" />Add Subcategory</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Add Subcategory</DialogTitle></DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Select Category <Required /></Label>
                              <Select value={selectedCategoryForSubCategory} onValueChange={setSelectedCategoryForSubCategory}>
                                <SelectTrigger><SelectValue placeholder="Choose a category..." /></SelectTrigger>
                                <SelectContent className="max-h-64">
                                  {categories.map((cat: string) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Subcategory Name <Required /></Label>
                              <Input value={newSubCategory} onChange={e => setNewSubCategory(e.target.value)} placeholder="e.g. Commercial, Residential" />
                            </div>
                            <Button onClick={handleAddSubCategory} className="w-full bg-green-600 hover:bg-green-700">
                              <Plus className="h-4 w-4 mr-2" />Add Subcategory
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <Input value={searchSubCategories} onChange={e => setSearchSubCategories(e.target.value)} placeholder="Search subcategories..." />
                    </div>
                    <Select value={filterSubCategoryByCategory} onValueChange={setFilterSubCategoryByCategory}>
                      <SelectTrigger className="w-full md:w-64"><SelectValue placeholder="Filter by Category" /></SelectTrigger>
                      <SelectContent className="max-h-64">
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="uncategorized" className="text-destructive italic">Uncategorized</SelectItem>
                        {categories.map((cat: string) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {subCategories.length === 0 ? (
                      <p className="text-center text-muted-foreground py-6">No subcategories yet</p>
                    ) : subCategories
                      .filter(sub =>
                        sub.name.toLowerCase().includes(searchSubCategories.toLowerCase()) &&
                        (filterSubCategoryByCategory === "all" ||
                          (filterSubCategoryByCategory === "uncategorized" ? !sub.category : sub.category === filterSubCategoryByCategory))
                      )
                      .map((sub: any) => (
                        <div key={sub.id} className="p-4 border rounded-lg bg-white hover:border-green-400 transition">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Layers className="h-5 w-5 text-green-600" />
                              <div>
                                <span className="font-medium">{sub.name}</span>
                                <span className="text-sm text-muted-foreground ml-2">(Category: {sub.category})</span>
                              </div>
                            </div>
                            {canManageSubcategories && (
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => {
                                  setEditingSubCategoryId(sub.id);
                                  setEditingSubCategoryName(sub.name);
                                  setEditingSubCategoryCategory(sub.category);
                                }}>Edit</Button>
                                <Button size="sm" variant="destructive" onClick={() => requestDeleteSubCategory(sub)}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            )}
                          </div>
                          {editingSubCategoryId === sub.id && (
                            <div className="mt-3 p-3 bg-gray-100 rounded border space-y-3">
                              <div>
                                <Label>Category</Label>
                                <Select value={editingSubCategoryCategory} onValueChange={setEditingSubCategoryCategory}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent className="max-h-64">
                                    {categories.map((cat: string) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Subcategory Name</Label>
                                <Input value={editingSubCategoryName} onChange={e => setEditingSubCategoryName(e.target.value)} placeholder="Subcategory name" className="text-sm" />
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleSaveSubCategory(sub.id)}>Save</Button>
                                <Button size="sm" variant="ghost" onClick={() => {
                                  setEditingSubCategoryId(null);
                                  setEditingSubCategoryName("");
                                  setEditingSubCategoryCategory("");
                                }}>Cancel</Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Products */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-blue-900">Create Products</CardTitle>
                      <CardDescription className="text-blue-800">Add new products and assign subcategories</CardDescription>
                    </div>
                    {canCreateProduct && (
                      <Dialog open={showAddProductDialog} onOpenChange={setShowAddProductDialog}>
                        <DialogTrigger asChild>
                          <Button className="bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4 mr-2" />Add Product</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Product Name <Required /></Label>
                              <Input value={newProduct.name} onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Ceramic Tiles" />
                            </div>
                            <div className="space-y-2">
                              <Label>Select Subcategory <Required /></Label>
                              <Select value={newProduct.subcategory} onValueChange={value => setNewProduct(prev => ({ ...prev, subcategory: value }))}>
                                <SelectTrigger><SelectValue placeholder="Choose a subcategory..." /></SelectTrigger>
                                <SelectContent className="max-h-64">
                                  {subCategories.map((sub: any) => (
                                    <SelectItem key={sub.id} value={sub.name}>
                                      {sub.name} <span className="text-xs text-muted-foreground">({sub.category})</span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label>HSN Code</Label>
                                <Input value={newProduct.hsnCode} onChange={e => setNewProduct({ ...newProduct, hsnCode: e.target.value })} placeholder="Enter HSN code" />
                              </div>
                              <div className="space-y-2">
                                <Label>SAC Code</Label>
                                <Input value={newProduct.sacCode} onChange={e => setNewProduct({ ...newProduct, sacCode: e.target.value })} placeholder="Enter SAC code" />
                              </div>
                            </div>
                            <Button
                              onClick={async () => {
                                await handleAddProduct();
                                if (newProduct.name.trim() && newProduct.subcategory) setShowAddProductDialog(false);
                              }}
                              className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                              <Plus className="h-4 w-4 mr-2" />Add Product
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <Input value={searchProducts} onChange={e => setSearchProducts(e.target.value)} placeholder="Search products..." />
                    </div>
                    <Select value={filterProductByCategory} onValueChange={val => { setFilterProductByCategory(val); setFilterProductBySubCategory("all"); }}>
                      <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Filter by Category" /></SelectTrigger>
                      <SelectContent className="max-h-64">
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="uncategorized" className="text-destructive italic">Uncategorized</SelectItem>
                        {categories.map((cat: string) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={filterProductBySubCategory} onValueChange={setFilterProductBySubCategory}>
                      <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Filter by Subcategory" /></SelectTrigger>
                      <SelectContent className="max-h-64">
                        <SelectItem value="all">All Subcategories</SelectItem>
                        <SelectItem value="uncategorized" className="text-destructive italic">Uncategorized</SelectItem>
                        {subCategories
                          .filter(sub => filterProductByCategory === "all" || (filterProductByCategory === "uncategorized" ? !sub.category : sub.category === filterProductByCategory))
                          .map((sub: any) => <SelectItem key={sub.id} value={sub.name}>{sub.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {products.length === 0 ? (
                      <p className="text-center text-muted-foreground py-6">No products yet</p>
                    ) : products
                      .filter(prod => {
                        const matchSearch = prod.name.toLowerCase().includes(searchProducts.toLowerCase());
                        const matchSub = filterProductBySubCategory === "all" ? true :
                          (filterProductBySubCategory === "uncategorized" ? !prod.subcategory : prod.subcategory === filterProductBySubCategory);
                        const prodSub = subCategories.find(s => s.name === prod.subcategory);
                        const matchCat = filterProductByCategory === "all" ? true :
                          (filterProductByCategory === "uncategorized"
                            ? !prod.subcategory || !prodSub?.category
                            : !!(prodSub && prodSub.category === filterProductByCategory));
                        return matchSearch && matchSub && matchCat;
                      })
                      .map((product: any) => (
                        <div key={product.id} className="p-4 border rounded-lg bg-white hover:border-blue-400 transition">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <Package className="h-5 w-5 text-blue-600" />
                              <div className="flex-1">
                                <span className="font-medium block">{product.name}</span>
                                <span className="text-sm text-muted-foreground">Subcategory: {product.subcategory || "-"}</span>
                                {product.taxCodeType && product.taxCodeValue && (
                                  <div className="text-sm text-muted-foreground mt-1">{product.taxCodeType.toUpperCase()}: {product.taxCodeValue}</div>
                                )}
                              </div>
                            </div>
                            {canManageProducts && (
                              <div className="flex gap-2">
                                <Button size="sm" variant="ghost" onClick={() => handleCloneProduct(product)} title="Clone"><Copy className="h-4 w-4" /></Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingProduct(mapProduct(product))}>Edit</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDeleteProduct(product.id)}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Edit Product Dialog */}
              {editingProduct && (
                <Dialog open={!!editingProduct} onOpenChange={open => { if (!open) setEditingProduct(null); }}>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Edit Product</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Product Name <Required /></Label>
                        <Input value={editingProduct.name} onChange={e => setEditingProduct((prev: any) => ({ ...prev, name: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Select Subcategory <Required /></Label>
                        <Select value={editingProduct.subcategory} onValueChange={value => setEditingProduct((prev: any) => ({ ...prev, subcategory: value }))}>
                          <SelectTrigger><SelectValue placeholder="Select subcategory" /></SelectTrigger>
                          <SelectContent className="max-h-64">
                            {subCategories.map((sub: any) => (
                              <SelectItem key={sub.id} value={sub.name}>{sub.name} ({sub.category})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>HSN Code</Label>
                          <Input value={editingProduct.hsnCode || ''} onChange={e => setEditingProduct((prev: any) => ({ ...prev, hsnCode: e.target.value }))} placeholder="Enter HSN code" />
                        </div>
                        <div className="space-y-2">
                          <Label>SAC Code</Label>
                          <Input value={editingProduct.sacCode || ''} onChange={e => setEditingProduct((prev: any) => ({ ...prev, sacCode: e.target.value }))} placeholder="Enter SAC code" />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
                        <Button
                          onClick={() => {
                            if (editingProduct.name.trim() && editingProduct.subcategory) {
                              handleUpdateProduct();
                            } else {
                              toast({ title: 'Error', description: 'Fill all fields', variant: 'destructive' });
                            }
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </TabsContent>
          )}

          {/* ── Materials Tab ── */}
          <TabsContent value="materials" className="space-y-4 mt-4">
            {(isAdminOrSoftwareTeam || user?.role === "purchase_team") && (
              <>
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-blue-900" id="create-material-section">
                      <Package className="inline-block mr-2 h-4 w-4" />Create Material
                    </CardTitle>
                    <CardDescription className="text-blue-800">Add new material templates for suppliers</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Item Name <span className="text-red-500">*</span></Label>
                        <Input value={newMasterMaterial.name} onChange={e => setNewMasterMaterial({ ...newMasterMaterial, name: e.target.value })} placeholder="Enter Item name" />
                        {newMasterMaterial.name && masterMaterials.some((m: any) => m.name.toLowerCase().trim() === newMasterMaterial.name.toLowerCase().trim()) && (
                          <p className="text-xs text-red-600">⚠️ Name already exists</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Item Code (Auto)</Label>
                        <Input value={newMasterMaterial.code} disabled className="bg-muted" />
                        {newMasterMaterial.code && masterMaterials.some((m: any) => m.code === newMasterMaterial.code) && (
                          <p className="text-xs text-red-600">⚠️ Code already exists</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Vendor Category</Label>
                        <Select value={newMasterMaterial.vendorCategory} onValueChange={value => setNewMasterMaterial({ ...newMasterMaterial, vendorCategory: value })}>
                          <SelectTrigger><SelectValue placeholder="Select vendor category" /></SelectTrigger>
                          <SelectContent className="max-h-[200px] overflow-y-auto">
                            {vendorCategories.length === 0 ? (
                              <SelectItem value="none" disabled>No categories available</SelectItem>
                            ) : vendorCategories.map(cat => (
                              <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Tax Code Type</Label>
                        <div className="flex gap-4 mt-2">
                          {[['hsn', 'HSN Code'], ['sac', 'SAC Code']].map(([val, label]) => (
                            <div key={val} className="flex items-center gap-2">
                              <input
                                type="radio" id={val} name="taxCodeType" value={val}
                                checked={newMasterMaterial.taxCodeType === val}
                                onChange={e => setNewMasterMaterial({ ...newMasterMaterial, taxCodeType: e.target.value as 'hsn' | 'sac' })}
                                className="w-4 h-4"
                              />
                              <Label htmlFor={val} className="cursor-pointer mb-0">{label}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      {newMasterMaterial.taxCodeType && (
                        <div className="space-y-2">
                          <Label>{newMasterMaterial.taxCodeType === 'hsn' ? 'HSN' : 'SAC'} Code <span className="text-red-500">*</span></Label>
                          <Input value={newMasterMaterial.taxCodeValue} onChange={e => setNewMasterMaterial({ ...newMasterMaterial, taxCodeValue: e.target.value })} placeholder="Enter code" />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddMasterMaterial}
                        disabled={
                          !newMasterMaterial.name.trim() ||
                          masterMaterials.some((m: any) => m.name.toLowerCase().trim() === newMasterMaterial.name.toLowerCase().trim()) ||
                          masterMaterials.some((m: any) => m.code === newMasterMaterial.code) ||
                          (!!newMasterMaterial.taxCodeType && !newMasterMaterial.taxCodeValue.trim())
                        }
                        className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="mr-2 h-4 w-4" />Create Material
                      </Button>
                      <Button variant="outline" onClick={() => {
                        setNewMasterMaterial({ name: "", code: "", vendorCategory: "", taxCodeType: null, taxCodeValue: "" });
                        toast({ title: "Form Cleared", description: "Creation form reset." });
                      }}>
                        Clear
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Created Material Templates</CardTitle>
                    <CardDescription>Manage material templates for suppliers</CardDescription>
                    <div className="mt-4">
                      <Input placeholder="Search materials..." value={masterSearch} onChange={e => setMasterSearch(e.target.value)} className="max-w-sm" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {masterMaterials.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">No templates created yet.</div>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto p-2">
                        {masterMaterials
                          .filter((t: any) => (t.name + ' ' + t.code + ' ' + (t.category || '')).toLowerCase().includes(masterSearch.toLowerCase()))
                          .slice(0, 36)
                          .map((template: any) => (
                            <div key={template.id} className="p-4 border rounded flex items-center justify-between bg-white">
                              <div className="flex-1">
                                {editingMaterialId === template.id ? (
                                  <div className="space-y-3 w-full">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div>
                                        <Label>Item Name <span className="text-red-500">*</span></Label>
                                        <Input value={newMaterial.name || ''} onChange={e => setNewMaterial({ ...newMaterial, name: e.target.value })} placeholder="Enter material name" />
                                      </div>
                                      <div>
                                        <Label>Item Code</Label>
                                        <Input value={template.code} disabled className="bg-muted" />
                                      </div>
                                      <div>
                                        <Label>Vendor Category</Label>
                                        <Select value={newMaterial.vendorCategory || ""} onValueChange={value => setNewMaterial({ ...newMaterial, vendorCategory: value })}>
                                          <SelectTrigger><SelectValue placeholder="Select vendor category" /></SelectTrigger>
                                          <SelectContent className="max-h-[200px] overflow-y-auto">
                                            {vendorCategories.map(cat => (
                                              <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label>Tax Code Type</Label>
                                        <div className="flex gap-4 mt-2">
                                          {[['hsn', 'HSN Code'], ['sac', 'SAC Code']].map(([val, label]) => (
                                            <div key={val} className="flex items-center gap-2">
                                              <input
                                                type="radio" id={`${val}-${template.id}`} name={`taxCodeType-${template.id}`} value={val}
                                                checked={newMaterial.taxCodeType === val}
                                                onChange={e => setNewMaterial({ ...newMaterial, taxCodeType: e.target.value as 'hsn' | 'sac' })}
                                                className="w-4 h-4"
                                              />
                                              <Label htmlFor={`${val}-${template.id}`} className="cursor-pointer mb-0">{label}</Label>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                      {newMaterial.taxCodeType && (
                                        <div className="md:col-span-2">
                                          <Label>{newMaterial.taxCodeType === 'hsn' ? 'HSN' : 'SAC'} Code</Label>
                                          <Input value={newMaterial.taxCodeValue || ""} onChange={e => setNewMaterial({ ...newMaterial, taxCodeValue: e.target.value })} placeholder="Enter code" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex gap-2 justify-end pt-2">
                                      <Button size="sm" variant="ghost" onClick={() => setEditingMaterialId(null)}>Cancel</Button>
                                      <Button size="sm" onClick={() => handleSaveMasterMaterial(template)}>Save Changes</Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="font-medium text-sm">{template.name}</div>
                                    <div className="text-xs text-muted-foreground">{template.code}</div>
                                  </div>
                                )}
                              </div>
                              {editingMaterialId !== template.id && (
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="outline" onClick={() => handleCloneMasterMaterial(template)} title="Clone"><Copy className="h-4 w-4" /></Button>
                                  <Button size="sm" onClick={() => {
                                    setEditingMaterialId(template.id);
                                    setNewMaterial({
                                      ...newMaterial,
                                      name: template.name,
                                      vendorCategory: template.vendor_category || '',
                                      taxCodeType: template.tax_code_type,
                                      taxCodeValue: template.tax_code_value || '',
                                    });
                                  }}>Edit</Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleDeleteMasterMaterial(template)}>Delete</Button>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ── Shops Tab ── */}
          <TabsContent value="shops" className="space-y-4 mt-4">
            {(isAdminOrSoftwareTeam || user?.role === "purchase_team") && (
              <Card>
                <CardHeader><CardTitle>Add New Shop</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      ["Shop Name", "name"],
                      ["Location", "location"],
                      ["City", "city"],
                      ["State", "state"],
                      ["Country", "country"],
                      ["Pincode / Zipcode", "pincode"],
                    ].map(([label, field]) => (
                      <div key={field} className="space-y-2">
                        <Label>{label} <span className="text-red-500">*</span></Label>
                        <Input
                          value={(newShop as any)[field] || ''}
                          onChange={e => setNewShop({ ...newShop, [field]: e.target.value })}
                        />
                      </div>
                    ))}
                    <div className="space-y-2">
                      <Label>Phone Number <span className="text-red-500">*</span></Label>
                      <div className="flex gap-2">
                        <Select value={newShop.phoneCountryCode || "+91"} onValueChange={value => setNewShop({ ...newShop, phoneCountryCode: value })}>
                          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {COUNTRY_CODES.map(c => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input value={newShop.contactNumber || ""} onChange={e => setNewShop({ ...newShop, contactNumber: e.target.value })} placeholder="Enter phone number" type="tel" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>GST No (Optional)</Label>
                      <Input value={newShop.gstNo || ''} onChange={e => setNewShop({ ...newShop, gstNo: e.target.value })} placeholder="29ABCDE1234F1Z5" />
                    </div>
                    <div className="space-y-2">
                      <Label>Vendor Category (Optional)</Label>
                      <Select value={newShop.vendorCategory || ""} onValueChange={value => setNewShop({ ...newShop, vendorCategory: value })}>
                        <SelectTrigger><SelectValue placeholder="Select vendor category" /></SelectTrigger>
                        <SelectContent className="max-h-[200px] overflow-y-auto">
                          {vendorCategories.length === 0 ? (
                            <SelectItem value="none" disabled>No categories available</SelectItem>
                          ) : vendorCategories.map(cat => (
                            <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={editingShopId ? handleUpdateShop : handleAddShop}>
                    {editingShopId ? 'Save Changes' : 'Add Shop'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── Approvals Tab ── */}
          {canManageShops && (
            <TabsContent value="approvals" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Shop Approval Requests</CardTitle>
                  <CardDescription>Review and approve/reject new shop submissions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {shopRequests.filter((r: any) => r.status === "pending").length === 0 ? (
                    <p className="text-muted-foreground">No pending approval requests</p>
                  ) : shopRequests.filter((r: any) => r.status === "pending").map((request: any) => (
                    <Card key={request.id} className="border-border/50">
                      <CardContent className="pt-6 space-y-4">
                        <div>
                          <h3 className="text-lg font-bold">{request.shop.name}</h3>
                          <p className="text-sm text-muted-foreground">Submitted by: {request.submittedBy} at {new Date(request.submittedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {[
                            ["Location", request.shop.location],
                            ["City", request.shop.city],
                            ["State", request.shop.state],
                            ["Country", request.shop.country],
                            ["Pincode", request.shop.pincode],
                            ["Phone", `${request.shop.phoneCountryCode}${request.shop.contactNumber}`],
                          ].map(([label, val]) => (
                            <div key={label}><p className="font-semibold">{label}</p><p>{val}</p></div>
                          ))}
                          {request.shop.gstNo && (
                            <div><p className="font-semibold">GST No</p><p>{request.shop.gstNo}</p></div>
                          )}
                        </div>
                        {canApproveReject && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleApproveShop(request)} className="gap-2" disabled={!request?.shop?.id}>
                              <CheckCircle2 className="h-4 w-4" />Approve
                            </Button>
                            {rejectingId === request.id ? (
                              <div className="flex gap-2 flex-1">
                                <Input placeholder="Reason..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="text-sm" />
                                <Button size="sm" onClick={() => handleRejectShop(request)}>Confirm</Button>
                                <Button size="sm" variant="ghost" onClick={() => setRejectingId(null)}>Cancel</Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => setRejectingId(request.id)} className="gap-2">
                                <XCircle className="h-4 w-4" />Reject
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
                {shopRequests.filter((r: any) => r.status !== "pending").length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">Processed Requests</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {shopRequests.filter((r: any) => r.status !== "pending").map((r: any) => (
                        <div key={r.id} className="flex justify-between items-start p-3 bg-muted/50 rounded">
                          <div>
                            <p className="font-semibold">{r.shop.name}</p>
                            <p className="text-sm text-muted-foreground">{r.submittedBy}</p>
                          </div>
                          <Badge variant={r.status === "approved" ? "default" : "destructive"}>
                            {r.status === "approved" ? "Approved" : r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </Card>
            </TabsContent>
          )}

          {/* ── Material Approvals Tab ── */}
          {(isAdminOrSoftwareTeam || user?.role === "purchase_team") && (
            <TabsContent value="material-approvals" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Material Approval Requests</CardTitle>
                  <CardDescription>Review and approve/reject material submissions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {materialRequests.filter((r: any) => r.status === "pending").length === 0 ? (
                    <p className="text-muted-foreground">No pending material approvals</p>
                  ) : materialRequests.filter((r: any) => r.status === "pending").map((request: any) => (
                    <Card key={request.id} className="border-border/50">
                      <CardContent className="pt-6 space-y-4">
                        <div>
                          <h3 className="text-lg font-bold">{request.material.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Submitted by: {request.submittedBy} at {new Date(request.submittedAt).toLocaleDateString()}
                          </p>
                          <div className="grid grid-cols-2 gap-3 text-sm mt-2">
                            {[
                              ["Code", request.material.code || request.material.template_code || '-'],
                              ["Rate", `₹${request.material.rate ?? '-'}`],
                              ["Unit", request.material.unit || '-'],
                              ["Category", request.material.category || request.material.vendorCategory || '-'],
                              ["Sub Category", request.material.subCategory || request.material.subcategory || '-'],
                              ["Brand", request.material.brandName || request.material.brandname || '-'],
                            ].map(([label, val]) => (
                              <div key={label}><p className="font-semibold">{label}</p><p>{val}</p></div>
                            ))}
                            {(request.material.technicalSpecification || request.material.technicalspecification) && (
                              <div className="col-span-2">
                                <p className="font-semibold">Technical Specification</p>
                                <p className="text-blue-600 italic text-xs">
                                  {request.material.technicalSpecification || request.material.technicalspecification}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        {canApproveReject && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleApproveMaterial(request.id)} className="gap-2" disabled={!request?.material?.id}>
                              <CheckCircle2 className="h-4 w-4" />Approve
                            </Button>
                            {rejectingId === request.id ? (
                              <div className="flex gap-2 flex-1">
                                <Input placeholder="Reason..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="text-sm" />
                                <Button size="sm" onClick={() => handleRejectMaterial(request.id)}>Confirm</Button>
                                <Button size="sm" variant="ghost" onClick={() => setRejectingId(null)}>Cancel</Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => setRejectingId(request.id)} className="gap-2">
                                <XCircle className="h-4 w-4" />Reject
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
                {materialRequests.filter((r: any) => r.status !== "pending").length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">Processed Requests</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {materialRequests.filter((r: any) => r.status !== "pending").map((r: any) => (
                        <div key={r.id} className="flex justify-between items-start p-3 bg-muted/50 rounded">
                          <div>
                            <p className="font-semibold">{r.material.name}</p>
                            <p className="text-sm text-muted-foreground">{r.submittedBy}</p>
                          </div>
                          <Badge variant={r.status === "approved" ? "default" : "destructive"}>
                            {r.status === "approved" ? "Approved" : r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </Card>
            </TabsContent>
          )}

          {/* ── Messages Tab ── */}
          {canViewSupportMessages && (
            <TabsContent value="messages" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Support Messages</CardTitle>
                  <CardDescription>Messages from suppliers and users</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(supportMessages || []).length === 0 ? (
                    <p className="text-muted-foreground">No messages yet</p>
                  ) : (supportMessages || []).map(msg => (
                    <Card key={msg.id} className="border-border/50">
                      <CardContent className="pt-6 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold">{msg.sender_name || msg.sentBy}</p>
                            <p className="text-sm text-muted-foreground">{new Date(msg.sent_at || msg.sentAt).toLocaleString()}</p>
                            {msg.info && (
                              <p className="text-xs text-muted-foreground mt-1">
                                <span className="font-semibold">Info: </span>{msg.info}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 items-start">
                            {!msg.is_read && <Badge variant="default">New</Badge>}
                            {canEditDelete && (
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteMessage(msg.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm leading-relaxed bg-muted/50 p-3 rounded">{msg.message}</p>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* ── Support Tab ── */}
          <TabsContent value="support" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Technical Support</CardTitle>
                <CardDescription>Request new categories or report issues to the software team.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Your Name <Required /></Label>
                  <Input placeholder="Enter your name..." value={supportSenderName} onChange={e => setSupportSenderName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Additional Information (Optional)</Label>
                  <Textarea placeholder="Any additional context..." className="min-h-[80px]" value={supportSenderInfo} onChange={e => setSupportSenderInfo(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Message / Request <Required /></Label>
                  <Textarea
                    placeholder="I need a new category for..."
                    className="min-h-[150px]"
                    value={supportMsg}
                    onChange={e => setSupportMsg(e.target.value)}
                    data-testid="textarea-support-message"
                  />
                </div>
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded text-sm text-blue-700 dark:text-blue-300">
                  ✓ This message will be sent to Admin & Software Team
                </div>
                <Button onClick={handleSupportSubmit} data-testid="button-send-support">
                  <MessageSquare className="mr-2 h-4 w-4" />Send Request
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* ── Delete Confirmation Modal ── */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent className="max-w-md border-t-4 border-t-destructive">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />Confirm Deletion
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4 pt-2">
                <div className="font-medium text-foreground">
                  Are you sure you want to delete {deleteData?.type}{' '}
                  <span className="underline italic text-primary">"{deleteData?.name}"</span>?
                </div>
                {deleteData && (
                  <div className="space-y-3 bg-muted/30 p-4 rounded-lg border max-h-[300px] overflow-y-auto">
                    {deleteData.type === 'category' && (
                      <>
                        {(deleteData.impact.subcategories?.filter(s => s?.trim()).length ?? 0) > 0 && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                              ⚠ Subcategories ({deleteData.impact.subcategories!.filter(s => s?.trim()).length})
                            </p>
                            <ImpactBadges items={deleteData.impact.subcategories} cls="bg-white/50" />
                          </div>
                        )}
                        {(deleteData.impact.templates?.filter(t => t?.trim()).length ?? 0) > 0 && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                              ⚠ Material Templates ({deleteData.impact.templates!.filter(t => t?.trim()).length})
                            </p>
                            <ImpactBadges items={deleteData.impact.templates} cls="bg-amber-50 text-amber-700 border-amber-200" />
                          </div>
                        )}
                      </>
                    )}
                    {(deleteData.impact.materials?.filter(m => m?.trim()).length ?? 0) > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                          ⚠ Materials ({deleteData.impact.materials!.filter(m => m?.trim()).length})
                        </p>
                        <ImpactBadges items={deleteData.impact.materials} cls="bg-orange-50 text-orange-700 border-orange-200" />
                      </div>
                    )}
                    {(deleteData.impact.products?.filter(p => p?.trim()).length ?? 0) > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                          ⚠ Products ({deleteData.impact.products!.filter(p => p?.trim()).length})
                        </p>
                        <ImpactBadges items={deleteData.impact.products} cls="bg-blue-50 text-blue-700 border-blue-100" />
                      </div>
                    )}
                    {!deleteData.impact.subcategories?.filter(s => s?.trim()).length &&
                      !deleteData.impact.templates?.filter(t => t?.trim()).length &&
                      !deleteData.impact.materials?.filter(m => m?.trim()).length &&
                      !deleteData.impact.products?.filter(p => p?.trim()).length && (
                        <p className="text-xs text-muted-foreground italic">No linked items will be affected.</p>
                      )}
                  </div>
                )}
                <p className="text-sm font-semibold text-destructive/80">
                  ⚠ All above items will be permanently deleted. Reassign them first if needed.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="bg-muted/10 p-4 -mx-6 -mb-6 border-t mt-4 rounded-b-lg">
              <AlertDialogCancel onClick={() => setDeleteConfirmOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteAction} className="bg-destructive hover:bg-destructive/90 text-white">
                Delete {deleteData?.type}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Template Delete Confirmation Dialog */}
        <AlertDialog open={templateDeleteOpen} onOpenChange={(open) => { if (!open) { setTemplateDeleteOpen(false); setTemplateDeleteTarget(null); setTemplateDeleteImpact(null); } }}>
          <AlertDialogContent className="max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Delete Material Template
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p>Are you sure you want to delete <strong>"{templateDeleteTarget?.name}"</strong>?</p>

                  {templateDeleteLoading ? (
                    <p className="text-sm text-muted-foreground">Loading affected items...</p>
                  ) : templateDeleteImpact && (
                    <>
                      {(templateDeleteImpact.linkedMaterials?.length > 0 || templateDeleteImpact.orphanedMaterials?.length > 0) && (
                        <div className="border rounded-md p-3 bg-amber-50/50">
                          <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">
                            ⚠ Materials that will be deleted ({(templateDeleteImpact.linkedMaterials?.length || 0) + (templateDeleteImpact.orphanedMaterials?.length || 0)})
                          </p>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {[...(templateDeleteImpact.linkedMaterials || []), ...(templateDeleteImpact.orphanedMaterials || [])].map((m: any, i: number) => (
                              <div key={m.id || i} className="flex items-center justify-between text-sm py-1 px-2 rounded bg-white border">
                                <span className="font-medium truncate flex-1">{m.name || m.code}</span>
                                <span className="text-muted-foreground text-xs mx-2">{m.shop_name || 'No shop'}</span>
                                <span className="font-mono text-xs">₹{Number(m.rate || 0).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {templateDeleteImpact.submissions?.length > 0 && (
                        <div className="border rounded-md p-3 bg-blue-50/50">
                          <p className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-1">
                            ⚠ Pending Submissions ({templateDeleteImpact.submissions.length})
                          </p>
                        </div>
                      )}

                      {templateDeleteImpact.totalAffected === 0 && (
                        <p className="text-xs text-muted-foreground italic">No linked materials or submissions will be affected.</p>
                      )}

                      {templateDeleteImpact.totalAffected > 0 && (
                        <p className="text-sm font-semibold text-destructive/80">
                          ⚠ All above items will be permanently deleted.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="bg-muted/10 p-4 -mx-6 -mb-6 border-t mt-4 rounded-b-lg">
              <AlertDialogCancel onClick={() => { setTemplateDeleteOpen(false); setTemplateDeleteTarget(null); setTemplateDeleteImpact(null); }}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteMasterMaterial} className="bg-destructive hover:bg-destructive/90 text-white" disabled={templateDeleteLoading}>
                Delete Template
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </Layout>
  );
}
