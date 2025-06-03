import React, { useState } from 'react';
import { useCompanies } from '@/lib/hooks/useCompanies';
import { 
  Building2, 
  Search, 
  Plus, 
  Users, 
  Globe,
  Edit,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CompaniesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { 
    companies, 
    isLoading, 
    error, 
    searchCompanies,
    createCompany,
    updateCompany,
    deleteCompany 
  } = useCompanies({
    search: searchTerm,
    includeStats: true
  });

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
  };

  const getSizeColor = (size: string) => {
    switch (size) {
      case 'startup': return 'blue';
      case 'small': return 'green';
      case 'medium': return 'orange';
      case 'large': return 'purple';
      case 'enterprise': return 'red';
      default: return 'gray';
    }
  };

  const formatDomain = (domain: string) => {
    return domain?.startsWith('www.') ? domain.slice(4) : domain;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-900/50 rounded-xl p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-800 rounded w-1/4"></div>
            <div className="h-4 bg-gray-800 rounded w-1/2"></div>
            <div className="grid gap-4 mt-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-800/50 rounded-xl"></div>
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
          <p className="text-red-300 text-sm">{error.message}</p>
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
          Manage your company database with {companies.length} companies
        </p>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search companies by name or domain..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
          />
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Company
        </Button>
      </div>

      {/* Companies Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((company) => (
          <div
            key={company.id}
            className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors"
          >
            {/* Company Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white truncate" title={company.name}>
                  {company.name}
                </h3>
                {company.domain && (
                  <div className="flex items-center gap-1 mt-1">
                    <Globe className="w-3 h-3 text-gray-400" />
                    <span className="text-sm text-gray-400 truncate">
                      {formatDomain(company.domain)}
                    </span>
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
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-1 ml-3">
                <button
                  className="p-1 text-gray-400 hover:text-white rounded"
                  title="Edit company"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  className="p-1 text-gray-400 hover:text-red-400 rounded"
                  title="Delete company"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Company Details */}
            <div className="space-y-3">
              {/* Industry and Size */}
              <div className="flex flex-wrap gap-2">
                {company.size && (
                  <Badge variant="outline" className="text-xs">
                    {company.size}
                  </Badge>
                )}
                {company.industry && (
                  <Badge variant="outline" className="text-xs">
                    {company.industry}
                  </Badge>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>{company.contactCount || 0} contacts</span>
                </div>
                <div className="text-emerald-400 font-medium">
                  {company.dealsValue ? 
                    new Intl.NumberFormat('en-GB', {
                      style: 'currency',
                      currency: 'GBP',
                      maximumFractionDigits: 0
                    }).format(company.dealsValue) : 
                    '£0'
                  }
                </div>
              </div>

              {/* Description */}
              {company.description && (
                <p className="text-sm text-gray-400 line-clamp-2">
                  {company.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {companies.length === 0 && !searchTerm && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-300 mb-2">No companies yet</h3>
          <p className="text-gray-400 mb-6">
            Start building your company database by adding your first company.
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Company
          </Button>
        </div>
      )}

      {/* No Search Results */}
      {companies.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-300 mb-2">No companies found</h3>
          <p className="text-gray-400 mb-6">
            Try adjusting your search term or add a new company.
          </p>
          <Button
            variant="outline"
            onClick={() => setSearchTerm('')}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Clear Search
          </Button>
        </div>
      )}
    </div>
  );
} 