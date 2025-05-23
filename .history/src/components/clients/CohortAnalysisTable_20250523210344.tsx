import React from 'react';

// Placeholder data for Cohort Analysis
const cohortData = [
  {
    cohort: 'Jan 2024 (100 users)',
    m1: { value: '95%', bgColor: 'bg-green-700/20', textColor: 'text-green-300' },
    m2: { value: '90%', bgColor: 'bg-green-700/30', textColor: 'text-green-200' },
    m3: { value: '88%', bgColor: 'bg-green-600/30', textColor: 'text-green-300' },
    m4: { value: '85%', bgColor: 'bg-yellow-600/30', textColor: 'text-yellow-300' },
    m5: { value: '82%', bgColor: 'bg-yellow-700/30', textColor: 'text-yellow-200' },
    m6: { value: '80%', bgColor: 'bg-red-700/30', textColor: 'text-red-300' },
  },
  {
    cohort: 'Feb 2024 (120 users)',
    m1: { value: '98%', bgColor: 'bg-green-700/20', textColor: 'text-green-300' },
    m2: { value: '94%', bgColor: 'bg-green-700/30', textColor: 'text-green-200' },
    m3: { value: '91%', bgColor: 'bg-green-600/30', textColor: 'text-green-300' },
    m4: { value: '89%', bgColor: 'bg-yellow-600/30', textColor: 'text-yellow-300' },
    m5: { value: '87%', bgColor: 'bg-yellow-700/30', textColor: 'text-yellow-200' },
    m6: { value: '-', bgColor: '', textColor: '' },
  },
  {
    cohort: 'Mar 2024 (90 users)',
    m1: { value: '92%', bgColor: 'bg-green-700/20', textColor: 'text-green-300' },
    m2: { value: '88%', bgColor: 'bg-green-700/30', textColor: 'text-green-200' },
    m3: { value: '85%', bgColor: 'bg-yellow-600/30', textColor: 'text-yellow-300' },
    m4: { value: '83%', bgColor: 'bg-yellow-700/30', textColor: 'text-yellow-200' },
    m5: { value: '-', bgColor: '', textColor: '' },
    m6: { value: '-', bgColor: '', textColor: '' },
  },
  {
    cohort: 'Apr 2024 (150 users)',
    m1: { value: '96%', bgColor: 'bg-green-700/20', textColor: 'text-green-300' },
    m2: { value: '93%', bgColor: 'bg-green-700/30', textColor: 'text-green-200' },
    m3: { value: '90%', bgColor: 'bg-green-600/30', textColor: 'text-green-300' },
    m4: { value: '-', bgColor: '', textColor: '' },
    m5: { value: '-', bgColor: '', textColor: '' },
    m6: { value: '-', bgColor: '', textColor: '' },
  },
];

const CohortAnalysisTable: React.FC = () => {
  const headers = ['Cohort (Signup Month)', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6'];

  return (
    <div className="overflow-x-auto bg-[#1E2022] border border-[#2C3035] rounded-xl shadow-lg p-4">
      <table className="w-full min-w-[600px] text-sm text-left text-[#A2ABB3]">
        <thead className="text-xs text-[#dce7f3] uppercase bg-[#2C3035]/50">
          <tr>
            {headers.map((header, index) => (
              <th 
                key={header} 
                scope="col" 
                className={`px-6 py-3 ${index === 0 ? 'rounded-tl-lg' : ''} ${index === headers.length - 1 ? 'rounded-tr-lg' : ''}`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohortData.map((row, rowIndex) => (
            <tr key={row.cohort} className={`${rowIndex < cohortData.length - 1 ? 'border-b border-[#2C3035]' : ''}`}>
              <td className={`px-6 py-4 font-medium text-white whitespace-nowrap ${rowIndex === cohortData.length - 1 ? 'rounded-bl-lg' : ''}`}>{row.cohort}</td>
              {['m1', 'm2', 'm3', 'm4', 'm5', 'm6'].map((monthKey, colIndex) => {
                const cellData = row[monthKey as keyof typeof row] as { value: string; bgColor: string; textColor: string };
                return (
                  <td 
                    key={monthKey} 
                    className={`px-6 py-4 ${cellData.bgColor} ${cellData.textColor} ${rowIndex === cohortData.length - 1 && colIndex === 5 ? 'rounded-br-lg' : ''}`}
                  >
                    {cellData.value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CohortAnalysisTable; 