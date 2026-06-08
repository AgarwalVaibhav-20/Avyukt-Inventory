import React, { useState, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateProfile, fetchProfile } from "@/store/slices/authSlice";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Save, 
  Loader2, 
  Building2, 
  ShieldCheck,
  AlertCircle,
  Copy,
  CheckCircle2,
  Link2
} from "lucide-react";
import { toast } from "react-hot-toast";

const ProfileView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, profileLoading, updateLoading } = useAppSelector((state) => state.auth);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    mobile: "",
    address: "",
    postalCode: "",
    companyName: "",
    role: "",
    linkedCrmOrganisationId: "",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [copiedInventoryOrgId, setCopiedInventoryOrgId] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fullname: user.fullname || "",
        email: user.email || "",
        mobile: user.mobile || "",
        address: user.address || "",
        postalCode: user.postalCode || "",
        companyName: user.companyName || "",
        role: user.role || "",
        linkedCrmOrganisationId: user.linkedCrmOrganisationId || "",
      });
      setImagePreview(user.profileImage || null);
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setSelectedFile(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload: any = {
        fullname: formData.fullname,
        mobile: formData.mobile,
        address: formData.address,
        postalCode: formData.postalCode,
        linkedCrmOrganisationId: formData.linkedCrmOrganisationId,
      };

      if (selectedFile) {
        payload.image = selectedFile;
      }

      const resultAction = await dispatch(updateProfile(payload));
      
      if (updateProfile.fulfilled.match(resultAction)) {
        toast.success("Profile updated successfully!");
        setSelectedFile(null);
      } else {
        toast.error(resultAction.payload as string || "Failed to update profile");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const handleCopyInventoryOrgId = async () => {
    if (!user?.organisationId) return;

    try {
      await navigator.clipboard.writeText(String(user.organisationId));
      setCopiedInventoryOrgId(true);
      setTimeout(() => setCopiedInventoryOrgId(false), 1800);
    } catch {
      toast.error("Unable to copy organization ID");
    }
  };

  if (profileLoading && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 size={40} className="text-blue-600 animate-spin-slow" />
        <p className="text-slate-500 font-medium">Loading profile data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end gap-6 pb-6 border-b border-slate-200">
        <div className="relative group">
          <div className="w-32 h-32 rounded-2xl bg-blue-50 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center text-blue-600">
            {imagePreview ? (
              <img src={imagePreview} alt="Profile" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            ) : (
              <User size={48} />
            )}
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all hover:scale-110 active:scale-95 group-hover:shadow-blue-500/50"
          >
            <Camera size={18} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            className="hidden" 
            accept="image/*"
          />
        </div>

        <div className="flex-1 space-y-1">
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{formData.fullname || "User Name"}</h2>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-full text-slate-600 font-medium capitalize">
              <ShieldCheck size={14} className="text-blue-500" /> {formData.role}
            </span>
            <span className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-full text-blue-600 font-medium">
              <Building2 size={14} /> {formData.companyName}
            </span>
            <span className="flex items-center gap-1.5">
              <Mail size={14} /> {formData.email}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Account Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Account Stats</h3>
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Inventory Organization ID</p>
                  <button
                    type="button"
                    onClick={handleCopyInventoryOrgId}
                    disabled={!user?.organisationId}
                    className="text-slate-400 transition-colors hover:text-blue-600 disabled:opacity-40"
                    title="Copy inventory organization ID"
                  >
                    {copiedInventoryOrgId ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-xs font-mono text-slate-600 mt-1 break-all">{user?.organisationId || "N/A"}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-[10px] font-bold text-blue-500 uppercase">CRM Link Status</p>
                <p className="text-xs text-blue-700 mt-1">
                  {formData.linkedCrmOrganisationId ? "CRM organization linked" : "Paste CRM organization ID to connect"}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Joined On</p>
                <p className="text-xs text-slate-600 mt-1">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
            <AlertCircle size={24} className="mb-4 opacity-80" />
            <h3 className="text-lg font-bold mb-2">Account Security</h3>
            <p className="text-indigo-100 text-xs leading-relaxed">
              Keep your profile information accurate to ensure proper authorization and audit tracking within the ACT system.
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                      type="text"
                      name="fullname"
                      value={formData.fullname}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                      type="text"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="+1 234 567 890"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Postal Code</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="12345"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">CRM Organization ID</label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    type="text"
                    name="linkedCrmOrganisationId"
                    value={formData.linkedCrmOrganisationId}
                    onChange={handleInputChange}
                    className="w-full bg-blue-50 border border-blue-200 rounded-xl pl-10 pr-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="Paste CRM organisation ID"
                  />
                </div>
                <p className="text-xs text-slate-500 ml-1">
                  Paste the CRM organisation ID from CRM profile so CRM sync data lands in this Inventory organization.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Full Address</label>
                <div className="relative">
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                    placeholder="123 Business Ave, Suite 100, City, Country"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-500/40 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {updateLoading ? (
                    <Loader2 size={20} className="animate-spin-slow" />
                  ) : (
                    <Save size={20} />
                  )}
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
