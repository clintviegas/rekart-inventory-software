import { useFormContext } from '../context/FormContext';
import FormField from './FormField';

export default function DeviceTracking() {
  const { state, dispatch } = useFormContext();
  const data = state.device;

  const set = (e) =>
    dispatch({ type: 'UPDATE_FORM', section: 'device', payload: { [e.target.name]: e.target.value } });

  return (
    <div className="form-section">
      <h2>2. Unique Device Tracking</h2>
      <p className="section-note">Critical for refurbished devices — each unit is individually tracked.</p>

      <h3>Device Identifiers</h3>
      <div className="form-grid">
        <FormField label="IMEI 1" name="IMEI_1" value={data.IMEI_1} onChange={set} placeholder="353456789012345" />
        <FormField label="IMEI 2 / eSIM IMEI" name="IMEI_2" value={data.IMEI_2} onChange={set} />
        <FormField label="Serial Number" name="Serial_Number" value={data.Serial_Number} onChange={set} />
        <FormField label="Service Tag" name="Service_Tag" value={data.Service_Tag} onChange={set} />
        <FormField label="Battery Serial" name="Battery_Serial" value={data.Battery_Serial} onChange={set} />
        <FormField label="Asset Tag" name="Asset_Tag" value={data.Asset_Tag} onChange={set} />
        <FormField label="Vendor Lot Number" name="Vendor_Lot_Number" value={data.Vendor_Lot_Number} onChange={set} />
        <FormField label="Data Wipe Certificate ID" name="Data_Wipe_Cert_ID" value={data.Data_Wipe_Cert_ID} onChange={set} />
        <FormField label="Diagnostic Report ID" name="Diagnostic_Report_ID" value={data.Diagnostic_Report_ID} onChange={set} />
        <FormField label="Grade ID" name="Grade_ID" value={data.Grade_ID} onChange={set} />
        <FormField label="QC Engineer Name" name="QC_Engineer_Name" value={data.QC_Engineer_Name} onChange={set} />
        <FormField label="QC Date" name="QC_Date" value={data.QC_Date} onChange={set} type="date" />
      </div>

      <h3>Laptop-Specific Fields</h3>
      <div className="form-grid">
        <FormField label="Laptop Serial" name="Laptop_Serial" value={data.Laptop_Serial} onChange={set} />
        <FormField label="Laptop Service Tag" name="Laptop_Service_Tag" value={data.Laptop_Service_Tag} onChange={set} />
        <FormField label="Battery Cycle Count" name="Battery_Cyle_Count" value={data.Battery_Cyle_Count} onChange={set} type="number" />
        <FormField label="SSD Health %" name="SSD_Health" value={data.SSD_Health} onChange={set} placeholder="98" />
        <FormField label="Keyboard Type" name="Keyboard_Type" value={data.Keyboard_Type} onChange={set} placeholder="Backlit US" />
      </div>
    </div>
  );
}
