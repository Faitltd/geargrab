import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Rental } from "@/api/entities";
import { GearItem } from "@/api/entities";
import { Message } from "@/api/entities";
import { GuaranteeClaim } from "@/api/entities";
import { TransactionRecord, TaxDocument } from "@/api/entities";
import { TaxDocumentService } from "@/services/taxDocumentService";
import { DataExportService } from "@/services/dataExportService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, 
  MessageSquare, 
  AlertTriangle, 
  Shield, 
  DollarSign,
  Calendar,
  Search,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ShieldCheck,
  FileText,
  Download
} from "lucide-react";
import { format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function AdminConsole() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [messages, setMessages] = useState([]);
  const [claims, setClaims] = useState([]);
  const [gearItems, setGearItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [claimNotes, setClaimNotes] = useState("");
  const [resolutionAmount, setResolutionAmount] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [taxDocuments, setTaxDocuments] = useState([]);
  const [selectedTaxYear, setSelectedTaxYear] = useState(new Date().getFullYear());
  const [isGeneratingTaxDocs, setIsGeneratingTaxDocs] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const currentUser = await User.me();
      if (currentUser.role !== 'admin') {
        navigate(createPageUrl("Profile"));
        return;
      }
      setUser(currentUser);
      loadAdminData();
    } catch (error) {
      console.error("Access denied:", error);
      navigate(createPageUrl("Profile"));
    }
  };

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      const [allUsers, allRentals, allMessages, allClaims, allGear, allTransactions, allTaxDocs] = await Promise.all([
        User.list("-created_date"),
        Rental.list("-created_date"),
        Message.list("-created_date"),
        GuaranteeClaim.list("-created_date"),
        GearItem.list("-created_date"),
        TransactionRecord.list("-created_date"),
        TaxDocument.list("-created_date")
      ]);

      setUsers(allUsers);
      setRentals(allRentals);
      setMessages(allMessages);
      setClaims(allClaims);
      setGearItems(allGear);
      setTransactions(allTransactions);
      setTaxDocuments(allTaxDocs);
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserStatusToggle = async (userId, currentStatus) => {
    try {
      await User.update(userId, { is_active: !currentStatus });
      loadAdminData();
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };
  
  const handleVerificationStatus = async (userId, status) => {
    try {
      await User.update(userId, { verification_status: status });
      loadAdminData();
    } catch (error) {
      console.error("Error updating verification status:", error);
    }
  };

  const handleClaimResolution = async (claimId, status) => {
    try {
      const updates = {
        status,
        admin_notes: claimNotes,
        resolved_date: new Date().toISOString().split('T')[0]
      };

      if (status === 'approved' && resolutionAmount) {
        updates.resolution_amount = parseFloat(resolutionAmount);
      }

      await GuaranteeClaim.update(claimId, updates);
      setSelectedClaim(null);
      setClaimNotes("");
      setResolutionAmount("");
      loadAdminData();
    } catch (error) {
      console.error("Error resolving claim:", error);
    }
  };

  const handleGenerate1099Forms = async () => {
    try {
      setIsGeneratingTaxDocs(true);
      const generatedDocs = await TaxDocumentService.generate1099FormsForYear(selectedTaxYear);
      console.log(`Generated ${generatedDocs.length} 1099 forms for ${selectedTaxYear}`);
      loadAdminData(); // Refresh to show new documents
    } catch (error) {
      console.error("Error generating 1099 forms:", error);
    } finally {
      setIsGeneratingTaxDocs(false);
    }
  };

  const handleSendTaxDocument = async (documentId) => {
    try {
      const success = await TaxDocumentService.sendTaxDocument(documentId);
      if (success) {
        console.log("Tax document sent successfully");
        loadAdminData(); // Refresh to show updated status
      }
    } catch (error) {
      console.error("Error sending tax document:", error);
    }
  };

  const getTransactionSummary = () => {
    const currentYear = new Date().getFullYear();
    const currentYearTransactions = transactions.filter(t => t.tax_year === currentYear);

    return {
      total_transactions: currentYearTransactions.length,
      total_revenue: currentYearTransactions.reduce((sum, t) => sum + (t.platform_revenue || 0), 0),
      total_volume: currentYearTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0)
    };
  };

  const handleExportTransactionData = async () => {
    try {
      setIsExporting(true);
      const exportResult = await DataExportService.exportTransactionData(selectedTaxYear, exportFormat);

      // Download the file
      DataExportService.downloadFile(
        exportResult.content,
        exportResult.metadata.filename,
        exportResult.metadata.mimeType
      );

      console.log(`Exported ${exportResult.metadata.recordCount} transactions for ${selectedTaxYear}`);
    } catch (error) {
      console.error("Error exporting transaction data:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAnnualReport = async () => {
    try {
      setIsExporting(true);
      const report = await DataExportService.generateAnnualTaxReport(selectedTaxYear);

      // Download as JSON
      const content = JSON.stringify(report, null, 2);
      DataExportService.downloadFile(
        content,
        `geargrab_annual_tax_report_${selectedTaxYear}.json`,
        'application/json'
      );

      console.log(`Generated annual tax report for ${selectedTaxYear}`);
    } catch (error) {
      console.error("Error generating annual report:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport1099Data = async () => {
    try {
      setIsExporting(true);
      const filingData = await DataExportService.export1099FilingData(selectedTaxYear);

      // Download as CSV for IRS filing
      const csvContent = DataExportService.generateCSV(filingData.filing_data);
      DataExportService.downloadFile(
        csvContent,
        `geargrab_1099_filing_data_${selectedTaxYear}.csv`,
        'text/csv'
      );

      console.log(`Exported 1099 filing data for ${selectedTaxYear}: ${filingData.summary.total_recipients} recipients`);
    } catch (error) {
      console.error("Error exporting 1099 data:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    const colors = {
      submitted: "bg-yellow-100 text-yellow-800",
      under_review: "bg-blue-100 text-blue-800",
      approved: "bg-green-100 text-green-800",
      denied: "bg-red-100 text-red-800",
      resolved: "bg-gray-100 text-gray-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">Admin privileges required</p>
          <Link to={createPageUrl("Profile")}>
            <Button>Return to Profile</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6 w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <Link to={createPageUrl("Profile")}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Console</h1>
              <p className="text-gray-600">Monitor and manage GearGrab platform</p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold">{users.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Rentals</p>
                    <p className="text-2xl font-bold">
                      {rentals.filter(r => r.status === 'active').length}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Open Claims</p>
                    <p className="text-2xl font-bold">
                      {claims.filter(c => !['resolved', 'denied', 'approved'].includes(c.status)).length}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold">
                      ${rentals.reduce((sum, r) => sum + (r.total_amount || 0), 0).toFixed(0)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-white shadow-sm border border-gray-100">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="claims">Claims</TabsTrigger>
            <TabsTrigger value="rentals">Rentals</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="tax-docs">
              <FileText className="w-4 h-4 mr-2" />
              Tax Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>User Management</CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Verification</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                              {u.profile_image ? (
                                <img src={u.profile_image} alt="" className="w-8 h-8 rounded-full object-cover" />
                              ) : (
                                <span className="text-emerald-600 text-sm font-medium">
                                  {u.full_name?.charAt(0) || 'U'}
                                </span>
                              )}
                            </div>
                            <span className="font-medium">{u.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge variant={
                            u.verification_status === 'verified' ? 'default' :
                            u.verification_status === 'pending' ? 'secondary' :
                            'outline'
                          } className={u.verification_status === 'verified' ? 'bg-green-100 text-green-800' : u.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}>
                            {u.verification_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.is_active ? "default" : "destructive"}>
                            {u.is_active ? "Active" : "Suspended"}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(u.created_date), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedUser(u)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                            </Dialog>
                            {u.verification_status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleVerificationStatus(u.id, 'verified')}
                                >
                                  <ShieldCheck className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleVerificationStatus(u.id, 'unverified')}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant={u.is_active ? "destructive" : "default"}
                              onClick={() => handleUserStatusToggle(u.id, u.is_active)}
                            >
                              {u.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="claims">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle>GearGrab Guarantee Claims</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim ID</TableHead>
                      <TableHead>Claimant</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {claims.map((claim) => (
                      <TableRow key={claim.id}>
                        <TableCell className="font-mono text-sm">{claim.id.slice(-8)}</TableCell>
                        <TableCell>{claim.claimant_email}</TableCell>
                        <TableCell>{claim.claim_type.replace('_', ' ')}</TableCell>
                        <TableCell>${claim.claim_amount}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(claim.status)}>
                            {claim.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {!['resolved', 'denied', 'approved'].includes(claim.status) && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedClaim(claim)}
                                >
                                  Review
                                </Button>
                              </DialogTrigger>
                            </Dialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rentals">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle>Rental Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rental ID</TableHead>
                      <TableHead>Renter</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rentals.slice(0, 20).map((rental) => (
                      <TableRow key={rental.id}>
                        <TableCell className="font-mono text-sm">{rental.id.slice(-8)}</TableCell>
                        <TableCell>{rental.renter_email}</TableCell>
                        <TableCell>{rental.owner_email}</TableCell>
                        <TableCell>
                          {format(new Date(rental.start_date), "MMM d")} - {format(new Date(rental.end_date), "MMM d")}
                        </TableCell>
                        <TableCell>${rental.total_amount}</TableCell>
                        <TableCell>
                           <Badge className={getStatusColor(rental.status) || "bg-gray-100 text-gray-800"}>
                            {rental.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle>Message Monitoring</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.slice(0, 20).map((message) => (
                      <TableRow key={message.id}>
                        <TableCell>{message.sender_email}</TableCell>
                        <TableCell>{message.receiver_email}</TableCell>
                        <TableCell className="max-w-md truncate">{message.content}</TableCell>
                        <TableCell>{format(new Date(message.created_date), "MMM d, HH:mm")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tax-docs">
            <div className="space-y-6">
              {/* Tax Document Generation */}
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle>Tax Document Generation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <label htmlFor="tax-year" className="font-medium">Tax Year:</label>
                      <select
                        id="tax-year"
                        value={selectedTaxYear}
                        onChange={(e) => setSelectedTaxYear(parseInt(e.target.value))}
                        className="border rounded px-3 py-1"
                      >
                        {[2024, 2023, 2022, 2021].map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    <Button
                      onClick={handleGenerate1099Forms}
                      disabled={isGeneratingTaxDocs}
                      className="flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      {isGeneratingTaxDocs ? "Generating..." : "Generate 1099 Forms"}
                    </Button>
                  </div>

                  {/* Export Controls */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <label htmlFor="export-format" className="font-medium">Export Format:</label>
                      <select
                        id="export-format"
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value)}
                        className="border rounded px-3 py-1"
                      >
                        <option value="csv">CSV</option>
                        <option value="json">JSON</option>
                        <option value="xlsx">Excel</option>
                      </select>
                    </div>

                    <Button
                      onClick={handleExportTransactionData}
                      disabled={isExporting}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {isExporting ? "Exporting..." : "Export Transactions"}
                    </Button>

                    <Button
                      onClick={handleExportAnnualReport}
                      disabled={isExporting}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Annual Report
                    </Button>

                    <Button
                      onClick={handleExport1099Data}
                      disabled={isExporting}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      1099 Filing Data
                    </Button>
                  </div>

                  {/* Transaction Summary */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {(() => {
                      const summary = getTransactionSummary();
                      return (
                        <>
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-blue-600">Total Transactions</p>
                            <p className="text-2xl font-bold text-blue-800">{summary.total_transactions}</p>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-green-600">Platform Revenue</p>
                            <p className="text-2xl font-bold text-green-800">${summary.total_revenue.toFixed(2)}</p>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <p className="text-sm text-purple-600">Total Volume</p>
                            <p className="text-2xl font-bold text-purple-800">${summary.total_volume.toFixed(2)}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* Tax Documents List */}
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle>Generated Tax Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document Type</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Tax Year</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Generated</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {taxDocuments.slice(0, 20).map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>{doc.document_type}</TableCell>
                          <TableCell>{doc.recipient_user_id}</TableCell>
                          <TableCell>{doc.tax_year}</TableCell>
                          <TableCell>${doc.total_earnings?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>
                            <Badge variant={
                              doc.document_status === 'sent' ? 'default' :
                              doc.document_status === 'generated' ? 'secondary' :
                              'outline'
                            }>
                              {doc.document_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {doc.created_at ? format(new Date(doc.created_at), "MMM d, yyyy") : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {doc.document_status === 'generated' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleSendTaxDocument(doc.id)}
                                  className="flex items-center gap-1"
                                >
                                  <Download className="w-3 h-3" />
                                  Send
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* User Detail Dialog */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold">Name</p>
                    <p>{selectedUser.full_name}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Email</p>
                    <p>{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Location</p>
                    <p>{selectedUser.location || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Phone</p>
                    <p>{selectedUser.phone || "Not provided"}</p>
                  </div>
                </div>
                {selectedUser.bio && (
                  <div>
                    <p className="font-semibold">Bio</p>
                    <p>{selectedUser.bio}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Claim Resolution Dialog */}
        <Dialog open={!!selectedClaim} onOpenChange={() => setSelectedClaim(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Resolve Claim</DialogTitle>
            </DialogHeader>
            {selectedClaim && (
              <div className="space-y-4">
                <div>
                  <p className="font-semibold">Claim Type</p>
                  <p>{selectedClaim.claim_type.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="font-semibold">Description</p>
                  <p>{selectedClaim.description}</p>
                </div>
                <div>
                  <p className="font-semibold">Claimed Amount</p>
                  <p>${selectedClaim.claim_amount}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Admin Notes</label>
                  <Textarea
                    value={claimNotes}
                    onChange={(e) => setClaimNotes(e.target.value)}
                    placeholder="Add resolution notes..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Resolution Amount (if approved)</label>
                  <Input
                    type="number"
                    value={resolutionAmount}
                    onChange={(e) => setResolutionAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleClaimResolution(selectedClaim.id, 'approved')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleClaimResolution(selectedClaim.id, 'denied')}
                    variant="destructive"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Deny
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}