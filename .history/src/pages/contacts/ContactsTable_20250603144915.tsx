import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Mail, 
  Phone,
  Edit,
  Trash2,
  ExternalLink,
  Building2,
  Download,
  ArrowUpDown,
  Star,
  StarOff
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { toast } from 'sonner';

const API_BASE_URL = 'http://localhost:8000/api';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  title: string;
  linkedin_url: string;
  is_primary: boolean;
  company_id: string;
  created_at: string;
  updated_at: string;
  companies?: {
    id: string;
    name: string;
    domain: string;
    size: string;
    industry: string;
    website: string;
  };
}

type SortField = 'full_name' | 'email' | 'title' | 'company_name' | 'is_primary' | 'created_at' | 'updated_at';
type SortDirection = 'asc' | 'desc';

export default function ContactsTable() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [primaryFilter, setPrimaryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Fetch contacts from API
  React.useEffect(() => {
    const fetchContacts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const params = new URLSearchParams({
          includeCompany: 'true'
        });
        
        if (searchTerm) {
          params.append('search', searchTerm);
        }

        const response = await fetch(`${API_BASE_URL}/contacts?${params}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        setContacts(result.data || []);
      } catch (err) {
        console.error('Error fetching contacts:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch contacts');
        toast.error('Failed to load contacts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContacts();
  }, [searchTerm]);

  // Filter and sort contacts
  const filteredAndSortedContacts = useMemo(() => {
    let filtered = contacts.filter(contact => {
      const matchesCompany = companyFilter === 'all' || 
        (contact.companies?.name === companyFilter);
      const matchesPrimary = primaryFilter === 'all' || 
        (primaryFilter === 'primary' ? contact.is_primary : !contact.is_primary);
      return matchesCompany && matchesPrimary;
    });

    // Sort contacts
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'company_name':
          aValue = a.companies?.name || '';
          bValue = b.companies?.name || '';
          break;
        default:
          aValue = a[sortField];
          bValue = b[sortField];
      }

      // Handle null/undefined values
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';

      // Convert to string for comparison if needed
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [contacts, companyFilter, primaryFilter, sortField, sortDirection]);

  // Get unique values for filters
  const uniqueCompanies = [...new Set(contacts
    .filter(c => c.companies?.name)
    .map(c => c.companies!.name)
  )];

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    return <ArrowUpDown className={`w-4 h-4 ${sortDirection === 'asc' ? 'text-blue-400' : 'text-blue-400 rotate-180'}`} />;
  };

  const formatName = (contact: Contact) => {
    if (contact.full_name) return contact.full_name;
    if (contact.first_name && contact.last_name) {
      return `${contact.first_name} ${contact.last_name}`;
    }
    if (contact.first_name) return contact.first_name;
    if (contact.last_name) return contact.last_name;
    return 'Unnamed Contact';
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Title', 'Company', 'Primary', 'Created'].join(','),
      ...filteredAndSortedContacts.map(contact => [
        `"${formatName(contact)}"`,
        `"${contact.email || ''}"`,
        `"${contact.phone || ''}"`,
        `"${contact.title || ''}"`,
        `"${contact.companies?.name || ''}"`,
        contact.is_primary ? 'Yes' : 'No',
        new Date(contact.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `contacts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Contacts exported successfully');
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-900/50 rounded-xl p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-800 rounded w-1/4"></div>
            <div className="h-4 bg-gray-800 rounded w-1/2"></div>
            <div className="space-y-3 mt-6">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-gray-800/50 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-900/20 border border-red-700 rounded-xl p-6">
          <h3 className="text-red-400 font-medium mb-2">Error loading contacts</h3>
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8 text-green-400" />
          <h1 className="text-3xl font-bold text-white">Contacts</h1>
        </div>
        <p className="text-gray-400">
          Manage your contact database • {filteredAndSortedContacts.length} of {contacts.length} contacts
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-900/50 rounded-xl p-6 mb-6 border border-gray-800">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search contacts by name, email, or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
            />
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-full sm:w-[200px] bg-gray-800/50 border-gray-700 text-white">
                <SelectValue placeholder="All Companies" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Companies</SelectItem>
                {uniqueCompanies.map(company => (
                  <SelectItem key={company} value={company}>{company}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={primaryFilter} onValueChange={setPrimaryFilter}>
              <SelectTrigger className="w-full sm:w-[150px] bg-gray-800/50 border-gray-700 text-white">
                <SelectValue placeholder="All Contacts" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Contacts</SelectItem>
                <SelectItem value="primary">Primary Only</SelectItem>
                <SelectItem value="secondary">Secondary Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-800 hover:bg-gray-800/50">
              <TableHead 
                className="text-gray-300 cursor-pointer hover:text-white"
                onClick={() => handleSort('full_name')}
              >
                <div className="flex items-center gap-2">
                  Contact {getSortIcon('full_name')}
                </div>
              </TableHead>
              <TableHead 
                className="text-gray-300 cursor-pointer hover:text-white"
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center gap-2">
                  Email {getSortIcon('email')}
                </div>
              </TableHead>
              <TableHead className="text-gray-300">Phone</TableHead>
              <TableHead 
                className="text-gray-300 cursor-pointer hover:text-white"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-2">
                  Title {getSortIcon('title')}
                </div>
              </TableHead>
              <TableHead 
                className="text-gray-300 cursor-pointer hover:text-white"
                onClick={() => handleSort('company_name')}
              >
                <div className="flex items-center gap-2">
                  Company {getSortIcon('company_name')}
                </div>
              </TableHead>
              <TableHead 
                className="text-gray-300 cursor-pointer hover:text-white text-center"
                onClick={() => handleSort('is_primary')}
              >
                <div className="flex items-center justify-center gap-2">
                  Primary {getSortIcon('is_primary')}
                </div>
              </TableHead>
              <TableHead className="text-gray-300 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedContacts.map((contact) => (
              <TableRow key={contact.id} className="border-gray-800 hover:bg-gray-800/30">
                <TableCell>
                  <div className="flex items-center gap-3">
                    {contact.is_primary && (
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    )}
                    <div className="flex flex-col">
                      <div className="font-medium text-white">{formatName(contact)}</div>
                      {contact.linkedin_url && (
                        <a
                          href={contact.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                        >
                          LinkedIn <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {contact.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        {contact.email}
                      </a>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {contact.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a
                        href={`tel:${contact.phone}`}
                        className="text-gray-300 hover:text-white"
                      >
                        {contact.phone}
                      </a>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {contact.title && (
                    <Badge variant="outline" className="text-xs">
                      {contact.title}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {contact.companies && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">{contact.companies.name}</span>
                      {contact.companies.website && (
                        <a
                          href={contact.companies.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {contact.is_primary ? (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      Primary
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-400">
                      Secondary
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredAndSortedContacts.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No contacts found</h3>
            <p className="text-gray-500 text-sm">
              {searchTerm || companyFilter !== 'all' || primaryFilter !== 'all' 
                ? 'Try adjusting your search criteria or filters'
                : 'Get started by adding your first contact'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 