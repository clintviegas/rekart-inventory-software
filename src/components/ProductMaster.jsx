import { useFormContext } from '../context/FormContext';
import FormField from './FormField';

const PRODUCT_TYPES = ['New', 'Refurbished', 'Open Box', 'Used', 'Parts Only'];

export default function ProductMaster() {
  const { state, dispatch } = useFormContext();
  const data = state.product;

  const set = (e) =>
    dispatch({ type: 'UPDATE_FORM', section: 'product', payload: { [e.target.name]: e.target.value } });

  return (
    <div className="form-section">
      <h2>1. Product Master — Identity</h2>

      <div className="form-grid">
        <FormField label="SKU / Internal SKU" name="SKU" value={data.SKU} onChange={set} placeholder="RK-IP13-128-BLK" />
        <FormField label="Barcode / QR Code" name="Barcode" value={data.Barcode} onChange={set} />
        <FormField label="Brand" name="Brand1" value={data.Brand1} onChange={set} placeholder="Apple" />
        <FormField label="Category" name="Category" value={data.Category} onChange={set} placeholder="Smartphones" />
        <FormField label="Sub-category" name="Sub_Category" value={data.Sub_Category} onChange={set} placeholder="iPhones" />
        <FormField label="Product Name" name="Product_Name" value={data.Product_Name} onChange={set} placeholder="iPhone 13" />
        <FormField label="Model Number" name="Model_Number" value={data.Model_Number} onChange={set} placeholder="A2633" />
        <FormField label="Series / Generation" name="Series" value={data.Series} onChange={set} placeholder="13 Series" />
        <FormField label="Color" name="Color" value={data.Color} onChange={set} placeholder="Midnight" />
        <FormField label="Storage / RAM" name="Storage_RAM" value={data.Storage_RAM} onChange={set} placeholder="128GB / 4GB" />
        <FormField label="Processor" name="Processor" value={data.Processor} onChange={set} placeholder="A15 Bionic" />
        <FormField label="Screen Size" name="Screen_Size" value={data.Screen_Size} onChange={set} placeholder="6.1 inch" />
        <FormField label="Keyboard Layout" name="Keyboard_Layout" value={data.Keyboard_Layout} onChange={set} placeholder="US QWERTY" />
        <FormField label="OS" name="OS" value={data.OS} onChange={set} placeholder="iOS 17" />
        <FormField label="Product Type" name="Product_Type" value={data.Product_Type} onChange={set} options={PRODUCT_TYPES} />
      </div>
    </div>
  );
}
