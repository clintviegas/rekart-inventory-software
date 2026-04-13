import { useFormContext } from '../context/FormContext';
import FormField from './FormField';

export default function InventoryStock() {
  const { state, dispatch } = useFormContext();
  const data = state.inventory;

  const set = (e) =>
    dispatch({ type: 'UPDATE_FORM', section: 'inventory', payload: { [e.target.name]: e.target.value } });

  return (
    <div className="form-section">
      <h2>3. Inventory &amp; Stock Control</h2>

      <h3>Stock Levels</h3>
      <div className="form-grid">
        <FormField label="Current Stock" name="Current_Stock" value={data.Current_Stock} onChange={set} type="number" />
        <FormField label="Available Stock" name="Available_Stock" value={data.Available_Stock} onChange={set} type="number" />
        <FormField label="Reserved Stock" name="Reserved_Stock" value={data.Reserved_Stock} onChange={set} type="number" />
        <FormField label="In Transit Stock" name="In_Transit_Stock" value={data.In_Transit_Stock} onChange={set} type="number" />
        <FormField label="Repair Stock" name="Repair_Stock" value={data.Repair_Stock} onChange={set} type="number" />
        <FormField label="Dead Stock" name="Dead_Stock" value={data.Dead_Stock} onChange={set} type="number" />
        <FormField label="Returned Stock" name="Returned_Stock" value={data.Returned_Stock} onChange={set} type="number" />
        <FormField label="Damaged Stock" name="Damaged_Stock" value={data.Damaged_Stock} onChange={set} type="number" />
        <FormField label="RMA Stock" name="RMA_Stock" value={data.RMA_Stock} onChange={set} type="number" />
      </div>

      <h3>Location</h3>
      <div className="form-grid">
        <FormField label="Warehouse Location" name="Warehouse_Location" value={data.Warehouse_Location} onChange={set} placeholder="Dubai Main WH" />
        <FormField label="Bin / Rack / Shelf" name="Bin_Rack_Shelf" value={data.Bin_Rack_Shelf} onChange={set} placeholder="A3-R2-S5" />
        <FormField label="Country Warehouse" name="Country_Warehouse" value={data.Country_Warehouse} onChange={set} placeholder="UAE" />
        <FormField label="Supplier Warehouse" name="Supplier_Warehouse" value={data.Supplier_Warehouse} onChange={set} />
      </div>

      <h3>Stock Parameters</h3>
      <div className="form-grid">
        <FormField label="Stock Aging (days)" name="Stock_Aging_Days" value={data.Stock_Aging_Days} onChange={set} type="number" />
        <FormField label="Last Inward Date" name="Last_Inward_Date" value={data.Last_Inward_Date} onChange={set} type="date" />
        <FormField label="Last Outward Date" name="Last_Outward_Date" value={data.Last_Outward_Date} onChange={set} type="date" />
        <FormField label="Reorder Point" name="Reorder_Point" value={data.Reorder_Point} onChange={set} type="number" />
        <FormField label="Minimum Stock" name="Minimum_Stock" value={data.Minimum_Stock} onChange={set} type="number" />
        <FormField label="Maximum Stock" name="Maximum_Stock" value={data.Maximum_Stock} onChange={set} type="number" />
        <FormField label="Lead Time (days)" name="Lead_Time" value={data.Lead_Time} onChange={set} type="number" />
        <FormField label="Safety Stock" name="Safety_Stock" value={data.Safety_Stock} onChange={set} type="number" />
      </div>
    </div>
  );
}
