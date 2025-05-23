import React from 'react';
import { Eye, Edit3 } from 'lucide-react'; // Icons for actions

// Placeholder data - this would come from props or state management
const clientsData = [
  {
    id: '1',
    name: 'Tech Solutions Inc.',
    status: 'Onboarding',
    statusColor: 'blue',
    contractValue: '$75,000',
    mrr: '$6,250',
    renewalDate: 'Dec 15, 2024',
  },
  {
    id: '2',
    name: 'Innovate Systems',
    status: 'Active',
    statusColor: 'green',
    contractValue: '$120,000',
    mrr: '$10,000',
    renewalDate: 'Mar 22, 2025',
  },
  {
    id: '3',
    name: 'Global Dynamics',
    status: 'Notice Given',
    statusColor: 'yellow',
    contractValue: '$50,000',
    mrr: '$4,167',
    renewalDate: 'Oct 01, 2024',
  },
  {
    id: '4',
    name: 'Quantum Leap Corp',
    status: 'Cancelled',
    statusColor: 'red',
    contractValue: '$90,000',
    mrr: '-',
    renewalDate: 'Aug 10, 2024 (Cancelled)',
  },
];

const getStatusBadgeClasses = (statusColor: string) => {
  switch (statusColor) {
    case 'blue':
      return 'bg-blue-600/30 text-blue-300 border border-blue-500/40';
    case 'green':
      return 'bg-green-600/30 text-green-300 border border-green-500/40';
    case 'yellow':
      return 'bg-yellow-600/30 text-yellow-300 border border-yellow-500/40';
    case 'red':
      return 'bg-red-600/30 text-red-300 border border-red-500/40';
    default:
      return 'bg-gray-600/30 text-gray-300 border border-gray-500/40';
  }
};

interface ClientTableProps {
  // Props for filtering and sorting will be added later
  clients: typeof clientsData; // Or a more specific type
}

const ClientTable: React.FC<ClientTableProps> = ({ clients = clientsData }) => {
  return (
    <div className="overflow-x-auto bg-[#1E2022] border border-[#2C3035] rounded-xl shadow-lg">
      <table className="w-full min-w-[800px] text-sm text-left text-[#A2ABB3]">
        <thead className="text-xs text-[#dce7f3] uppercase bg-[#2C3035]/50">
          <tr>
            <th scope="col" className="px-6 py-3 rounded-tl-lg">Client Name</th>
            <th scope="col" className="px-6 py-3">Status</th>
            <th scope="col" className="px-6 py-3">Contract Value</th>
            <th scope="col" className="px-6 py-3">MRR</th>
            <th scope="col" className="px-6 py-3">Renewal Date</th>
            <th scope="col" className="px-6 py-3 rounded-tr-lg">Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client, index) => (
            <tr 
              key={client.id} 
              className={`border-b border-[#2C3035] hover:bg-[#2C3035]/30 ${index === clients.length - 1 ? 'border-b-0' : ''}`}
            >
              <td className={`px-6 py-4 font-medium text-white whitespace-nowrap ${index === clients.length -1 && clients.length > 0 ? 'rounded-bl-lg' : ''}`}>
                {client.name}
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadgeClasses(client.statusColor)}`}>
                  {client.status}
                </span>
              </td>
              <td className="px-6 py-4 text-white">{client.contractValue}</td>
              <td className="px-6 py-4 text-white">{client.mrr}</td>
              <td className="px-6 py-4 text-white">{client.renewalDate}</td>
              <td className={`px-6 py-4 ${index === clients.length -1 && clients.length > 0 ? 'rounded-br-lg' : ''}`}>
                <button className="text-[#A2ABB3] hover:text-white">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="text-[#A2ABB3] hover:text-white ml-2">
                  <Edit3 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClientTable; 