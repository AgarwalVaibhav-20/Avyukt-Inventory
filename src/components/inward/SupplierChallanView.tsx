import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchGRNs } from "@/store/slices/procurementSlice";
import {
  Search,
  FileText,
  Paperclip,
  Loader2,
  Download,
  AlertCircle,
  Filter,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

const SupplierChallanView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { grns, loading, error } = useAppSelector((state) => state.procurement);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchGRNs());
  }, [dispatch]);

  const filteredGRNs = grns.filter(
    (g) =>
      g.challanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.grnNumber.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6 bg-white min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-700 rounded-lg text-white">
            <Paperclip size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Challan / Invoice Repository
            </h1>
            <p className="text-sm text-slate-500">
              Centralized documentation for all supplier shipments.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                Total Documents
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {grns.length}
              </p>
            </div>
            <div className="p-2.5 bg-slate-100 rounded-lg">
              <FileText size={22} className="text-slate-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                Verified Challans
              </p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {grns.filter((g) => g.challanNumber).length}
              </p>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-lg">
              <CheckCircle size={22} className="text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                Filtered Results
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {filteredGRNs.length}
              </p>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-lg">
              <Search size={22} className="text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <CardTitle className="text-base font-semibold text-slate-800">
              Document Register
            </CardTitle>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search
                  size={14}
                  className="absolute left-3 top-2.5 text-slate-400"
                />
                <Input
                  placeholder="Search by challan, GRN, or vendor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200 text-sm"
                />
              </div>
              <Button variant="outline" size="sm" className="gap-2 shrink-0">
                <Filter size={14} />
                Filter
              </Button>
              <Button
                size="sm"
                className="gap-2 bg-slate-800 hover:bg-slate-900 text-white shrink-0"
              >
                <Download size={14} />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {error && (
            <div className="p-4">
              <Alert variant="destructive">
                <AlertCircle size={16} />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Document Info
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  GRN Mapping
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Vendor
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Receipt Date
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Status
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                    <Loader2
                      className="animate-spin-slow text-slate-600 mx-auto mb-2"
                      size={28}
                    />
                    <p className="text-slate-400 text-sm">
                      Scanning document repository...
                    </p>
                  </TableCell>
                </TableRow>
              ) : filteredGRNs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                    <FileText
                      className="mx-auto mb-2 text-slate-200"
                      size={40}
                    />
                    <p className="text-slate-400 text-sm">
                      No matching challans or invoices found.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredGRNs.map((grn) => (
                  <TableRow
                    key={grn.id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center transition-colors">
                          <FileText
                            size={16}
                            className="text-slate-400 group-hover:text-blue-500 transition-colors"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {grn.challanNumber || "N/A"}
                          </p>
                          <p className="text-xs text-slate-400">
                            Supplier Document
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span className="font-semibold text-blue-600 font-mono text-xs">
                          {grn.grnNumber}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-slate-700">
                        {grn.vendorName}
                      </p>
                      <p className="text-xs text-slate-400">Active Partner</p>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {grn.date}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle size={11} />
                        System Mapped
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5 text-xs h-7"
                      >
                        <Paperclip size={12} />
                        View Invoice
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Footer */}
      {!loading && filteredGRNs.length > 0 && (
        <Card className="border border-slate-200 shadow-sm bg-slate-900 text-white">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <Paperclip size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">
                    {filteredGRNs.length} Documents Verified
                  </p>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                    100% Audit Accuracy
                  </p>
                </div>
              </div>
              <Button className="bg-white text-slate-900 hover:bg-blue-500 hover:text-white transition-all text-sm font-semibold gap-2">
                <CheckCircle size={15} />
                Run Batch Audit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SupplierChallanView;
