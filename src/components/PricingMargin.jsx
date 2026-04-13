import { useFormContext } from '../context/FormContext';
import FormField from './FormField';

const YES_NO = ['Yes', 'No'];

export default function PricingMargin() {
  const { state, dispatch } = useFormContext();
  const data = state.pricing;

  const set = (e) =>
    dispatch({ type: 'UPDATE_FORM', section: 'pricing', payload: { [e.target.name]: e.target.value } });

  return (
    <div className="form-section">
      <h2>4. Pricing &amp; Margin</h2>

      <h3>Procurement Costs</h3>
      <div className="form-grid">
        <FormField label="Vendor Buy Price" name="Vendor_Buy_Price" value={data.Vendor_Buy_Price} onChange={set} type="number" />
        <FormField label="Landed Cost" name="Landed_Cost" value={data.Landed_Cost} onChange={set} type="number" />
        <FormField label="Import Duty" name="Import_Duty" value={data.Import_Duty} onChange={set} type="number" />
        <FormField label="VAT Input" name="VAT_Input" value={data.VAT_Input} onChange={set} type="number" />
        <FormField label="Repair Cost" name="Repair_Cost" value={data.Repair_Cost} onChange={set} type="number" />
        <FormField label="Accessory Cost" name="Accessory_Cost" value={data.Accessory_Cost} onChange={set} type="number" />
        <FormField label="Packaging Cost" name="Packaging_Cost" value={data.Packaging_Cost} onChange={set} type="number" />
        <FormField label="QC Cost" name="QC_Cost" value={data.QC_Cost} onChange={set} type="number" />
        <FormField label="Logistics Inward" name="Logistic_Inward" value={data.Logistic_Inward} onChange={set} type="number" />
        <FormField label="Refurbishment Cost" name="Refurbishment_Cost1" value={data.Refurbishment_Cost1} onChange={set} type="number" />
        <FormField label="Total Cost Price" name="Total_Cost_Price" value={data.Total_Cost_Price} onChange={set} type="number" />
      </div>

      <h3>Selling Prices</h3>
      <div className="form-grid">
        <FormField label="MRP / Compare Price" name="MRP" value={data.MRP} onChange={set} type="number" />
        <FormField label="Retail Selling Price" name="Retail_Selling_Price" value={data.Retail_Selling_Price} onChange={set} type="number" />
        <FormField label="Wholesale Price" name="Wholesale_Price" value={data.Wholesale_Price} onChange={set} type="number" />
        <FormField label="B2B Bulk Price" name="B2B_Bulk_Price" value={data.B2B_Bulk_Price} onChange={set} type="number" />
        <FormField label="Marketplace Price (Amazon)" name="Price_Amazon" value={data.Price_Amazon} onChange={set} type="number" />
        <FormField label="Marketplace Price (Noon)" name="Price_Noon" value={data.Price_Noon} onChange={set} type="number" />
        <FormField label="Website Price" name="Website_Price" value={data.Website_Price} onChange={set} type="number" />
        <FormField label="POS Store Price" name="POS_Store_Price" value={data.POS_Store_Price} onChange={set} type="number" />
        <FormField label="Offer Price" name="Offer_Price" value={data.Offer_Price} onChange={set} type="number" />
        <FormField label="Coupon Allowed" name="Coupon_Allowed" value={data.Coupon_Allowed} onChange={set} options={YES_NO} />
        <FormField label="Minimum Selling Price" name="Min_Selling_Price" value={data.Min_Selling_Price} onChange={set} type="number" />
        <FormField label="MAP Price" name="MAP_Price" value={data.MAP_Price} onChange={set} type="number" />
        <FormField label="Dealer Price" name="Dealer_Price" value={data.Dealer_Price} onChange={set} type="number" />
        <FormField label="Distributor Price" name="Distributor_Price" value={data.Distributor_Price} onChange={set} type="number" />
      </div>

      <h3>Profitability</h3>
      <div className="form-grid">
        <FormField label="Gross Margin %" name="Gross_Margin" value={data.Gross_Margin} onChange={set} type="number" />
        <FormField label="Net Margin %" name="Net_Margin" value={data.Net_Margin} onChange={set} type="number" />
        <FormField label="Contribution Margin" name="Contribution_Margin" value={data.Contribution_Margin} onChange={set} type="number" />
        <FormField label="Breakeven Price" name="Breakeven_Price" value={data.Breakeven_Price} onChange={set} type="number" />
        <FormField label="Expected Profit" name="Expected_Profit" value={data.Expected_Profit} onChange={set} type="number" />
        <FormField label="Realized Profit (After Sale)" name="Realised_Profit" value={data.Realised_Profit} onChange={set} type="number" />
      </div>
    </div>
  );
}
