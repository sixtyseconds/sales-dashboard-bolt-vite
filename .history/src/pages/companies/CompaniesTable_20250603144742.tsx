import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  Users, 
  Globe,
  Edit,
  Trash2,
  ExternalLink,
  Filter,
  Download,
  ArrowUpDown
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

interface Company {
  id: string;
  name: string;
  domain: string;
  size: string;
  industry: string;
  website: string;
  linkedin_url: string;
  description: string;
  contactCount: number;
  dealsCount: number;
  dealsValue: number;
  created_at: string;
  updated_at: string;
}

type SortField = 'name' | 'domain' | 'size' | 'industry' | 'contactCount' | 'dealsCount' | 'dealsValue' | 'created_at' | 'updated_at';
type SortDirection = 'asc' | 'desc';

export default function CompaniesTable() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Fetch companies from API
  React.useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const params = new URLSearchParams({
          includeStats: 'true'
        });
        
        if (searchTerm) {
          params.append('search', searchTerm);
        }

        const response = await fetch(`${API_BASE_URL}/companies?${params}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        setCompanies(result.data || []);
      } catch (err) {
        console.error('Error fetching companies:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch companies');
        toast.error('Failed to load companies');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanies();
  }, [searchTerm]);

  // Filter and sort companies
  const filteredAndSortedCompanies = useMemo(() => {
    let filtered = companies.filter(company => {
      const matchesSize = sizeFilter === 'all' || company.size === sizeFilter;
      const matchesIndustry = industryFilter === 'all' || company.industry === industryFilter;
      return matchesSize && matchesIndustry;
    });

    // Sort companies
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

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
  }, [companies, sizeFilter, industryFilter, sortField, sortDirection]);

  // Get unique values for filters
  const uniqueSizes = [...new Set(companies.map(c => c.size).filter(Boolean))];
  const uniqueIndustries = [...new Set(companies.map(c => c.industry).filter(Boolean))];

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDomain = (domain: string) => {
    return domain?.startsWith('www.') ? domain.slice(4) : domain;
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Name', 'Domain', 'Size', 'Industry', 'Contacts', 'Deals', 'Value', 'Created'].join(','),
      ...filteredAndSortedCompanies.map(company => [
        `"${company.name}"`,
        `"${company.domain || ''}"`,
        `"${company.size || ''}"`,
        `"${company.industry || ''}"`,
        company.contactCount || 0,
        company.dealsCount || 0,
        company.dealsValue || 0,
        new Date(company.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `companies_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Companies exported successfully');
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
          <h3 className="text-red-400 font-medium mb-2">Error loading companies</h3>
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
          <Building2 className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">Companies</h1>
        </div>
        <p className="text-gray-400">
          Manage your company database • {filteredAndSortedCompanies.length} of {companies.length} companies
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-900/50 rounded-xl p-6 mb-6 border border-gray-800">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search companies by name or domain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
            />
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={sizeFilter} onValueChange={setSizeFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-gray-800/50 border-gray-700 text-white">
                <SelectValue placeholder="All Sizes" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Sizes</SelectItem>
                {uniqueSizes.map(size => (
                  <SelectItem key={size} value={size}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-gray-800/50 border-gray-700 text-white">
                <SelectValue placeholder="All Industries" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Industries</SelectItem>
                {uniqueIndustries.map(industry => (
                  <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Company
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
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  Company {getSortIcon('name')}
                </div>
              </TableHead>
              <TableHead 
                className="text-gray-300 cursor-pointer hover:text-white"
                onClick={() => handleSort('domain')}
              >
                <div className="flex items-center gap-2">
                  Domain {getSortIcon('domain')}
                </div>
              </TableHead>
              <TableHead 
                className="text-gray-300 cursor-pointer hover:text-white"
                onClick={() => handleSort('size')}
              >
                <div className="flex items-center gap-2">
                  Size {getSortIcon('size')}
                </div>
              </TableHead>
              <TableHead 
                className="text-gray-300 cursor-pointer hover:text-white"
                onClick={() => handleSort('industry')}
              >
                <div className="flex items-center gap-2">
                  Industry {getSortIcon('industry')}
                </div>
              </TableHead>
              <TableHead 
                className="text-gray-300 cursor-pointer hover:text-white text-center"
                onClick={() => handleSort('contactCount')}
              >
                <div className="flex items-center justify-center gap-2">
                  Contacts {getSortIcon('contactCount')}
                </div>
              </TableHead>
              <TableHead 
                className="text-gray-300 cursor-pointer hover:text-white text-center"
                onClick={() => handleSort('dealsCount')}
              >
                <div className="flex items-center justify-center gap-2">
                  Deals {getSortIcon('dealsCount')}
                </div>
              </TableHead>
              <TableHead 
                className="text-gray-300 cursor-pointer hover:text-white text-right"
                onClick={() => handleSort('dealsValue')}
              >
                <div className="flex items-center justify-end gap-2">
                  Value {getSortIcon('dealsValue')}
                </div>
              </TableHead>
              <TableHead className="text-gray-300 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedCompanies.map((company) => (
              <TableRow key={company.id} className="border-gray-800 hover:bg-gray-800/30">
                <TableCell>
                  <div className="flex flex-col">
                    <div className="font-medium text-white">{company.name}</div>
                    {company.description && (
                      <div className="text-sm text-gray-400 truncate max-w-xs">
                        {company.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {company.domain && (
                      <>
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">{formatDomain(company.domain)}</span>
                        {company.website && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {company.size && (
                    <Badge variant="outline" className="text-xs">
                      {company.size}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {company.industry && (
                    <Badge variant="outline" className="text-xs">
                      {company.industry}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-300">
                    <Users className="w-4 h-4 text-gray-400" />
                    {company.contactCount || 0}
                  </div>
                </TableCell>
                <TableCell className="text-center text-gray-300">
                  {company.dealsCount || 0}
                </TableCell>
                <TableCell className="text-right text-emerald-400 font-medium">
                  {formatCurrency(company.dealsValue || 0)}
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
        
        {filteredAndSortedCompanies.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No companies found</h3>
            <p className="text-gray-500 text-sm">
              {searchTerm || sizeFilter !== 'all' || industryFilter !== 'all' 
                ? 'Try adjusting your search criteria or filters'
                : 'Get started by adding your first company'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 