import { useFormContext } from '../context/FormContext';
import FormField from './FormField';

const YES_NO = ['Yes', 'No'];

export default function MarketplaceChannels() {
  const { state, dispatch } = useFormContext();
  const data = state.marketplace;

  const set = (e) =>
    dispatch({ type: 'UPDATE_FORM', section: 'marketplace', payload: { [e.target.name]: e.target.value } });

  return (
    <div className="form-section">
      <h2>6. Marketplace &amp; Sales Channel Mapping</h2>

      <h3>Channel IDs</h3>
      <div className="form-grid">
        <FormField label="Amazon ASIN" name="Amazon_ASIN" value={data.Amazon_ASIN} onChange={set} placeholder="B0XXXXXXXX" />
        <FormField label="Noon SKU" name="Noon_SKU" value={data.Noon_SKU} onChange={set} />
        <FormField label="Shopify SKU" name="Shopify_SKU" value={data.Shopify_SKU} onChange={set} />
        <FormField label="Dubizzle Listing ID" name="Dubizzle_ID" value={data.Dubizzle_ID} onChange={set} />
        <FormField label="OpenSooq ID" name="OpenSooq_ID" value={data.OpenSooq_ID} onChange={set} />
        <FormField label="Category Mapping" name="Category_M" value={data.Category_M} onChange={set} placeholder="Electronics > Phones > iPhones" />
      </div>

      <h3>Listing Content</h3>
      <div className="form-grid">
        <FormField label="SEO Title" name="SEO_Title" value={data.SEO_Title} onChange={set} placeholder="iPhone 13 128GB Refurbished Grade A" />
        <FormField label="Short Title" name="Short_Title" value={data.Short_Title} onChange={set} placeholder="iPhone 13 128GB" />
        <FormField label="Marketplace Bullets" name="Marketplace_Bullets" value={data.Marketplace_Bullets} onChange={set} type="textarea" placeholder="• 128GB Storage&#10;• Grade A Condition&#10;• 87% Battery" />
        <FormField label="Condition Note" name="Condition_Note" value={data.Condition_Note} onChange={set} type="textarea" placeholder="Minor scratches on body, battery 87%" />
        <FormField label="Listing Image Folder" name="Listing_Image_Folder" value={data.Listing_Image_Folder} onChange={set} placeholder="/images/RK-IP13-128/" />
        <FormField label="A+ Content Folder" name="Aplus_Content_Folder" value={data.Aplus_Content_Folder} onChange={set} placeholder="/aplus/RK-IP13/" />
      </div>

      <h3>Channel Flags</h3>
      <div className="form-grid">
        <FormField label="Ad Priority" name="Ad_Priority" value={data.Ad_Priority} onChange={set} options={['High', 'Medium', 'Low', 'None']} />
        <FormField label="Top SKU Flag" name="Top_SKU_Flag" value={data.Top_SKU_Flag} onChange={set} options={YES_NO} />
        <FormField label="Exclusive SKU Flag" name="Exclusive_SKU_Flag" value={data.Exclusive_SKU_Flag} onChange={set} options={YES_NO} />
      </div>
    </div>
  );
}
