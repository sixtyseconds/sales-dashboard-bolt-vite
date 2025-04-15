# Edit Deal Modal

A React component that provides a modal interface for editing deal information in the sales dashboard.

## Features

- Tabbed interface with sections for:
  - Deal Details
  - Pipeline Stage
  - Lead Source
  - Activity
- Full accessibility support with proper focus management
- Form validation for required fields
- Responsive design
- Keyboard navigation

## Usage

```tsx
import EditDealModal from '@/components/EditDealModal';

const YourComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [deal, setDeal] = useState(dealData);
  
  const handleSave = async (formData) => {
    // Update the deal in your state/API
    await updateDealInAPI(formData);
  };
  
  const handleDelete = async (dealId) => {
    // Delete the deal in your state/API
    await deleteDealFromAPI(dealId);
  };
  
  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Edit Deal
      </button>
      
      <EditDealModal 
        open={isOpen}
        setOpen={setIsOpen}
        deal={deal}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </>
  );
};
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | Controls whether the modal is open or closed |
| `setOpen` | `(open: boolean) => void` | Function to set the open state |
| `deal` | `object` | The deal object to edit |
| `onSave` | `(formData: any) => Promise<void>` | Function called when saving changes |
| `onDelete` | `(dealId: string) => Promise<void>` | Function called when deleting the deal |

## Expected Deal Object Structure

```ts
interface Deal {
  id: string;
  dealName: string;
  company: string;
  contactName?: string;
  closeDate?: string;
  dealValue: number;
  stage: string;
  probability: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  dealSize?: 'small' | 'medium' | 'large' | 'strategic';
  leadSource?: {
    type: 'inbound' | 'outbound' | 'event' | 'referral';
    channel: string;
  };
  nextAction?: string;
  description?: string;
}
```

## Accessibility Features

- Proper focus management when opening modal and switching tabs
- Keyboard navigation between tabs using arrow keys
- Proper ARIA attributes throughout
- Input fields with proper labels, required indicators
- Error messages linked to fields with aria-describedby

## Design Decisions

- Using context for form state management
- Tab sections are implemented using ARIA tablist pattern
- Focus trapping within the modal
- Keyboard shortcuts for form submission 