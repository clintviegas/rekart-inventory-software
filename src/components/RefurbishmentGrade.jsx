import { useFormContext } from '../context/FormContext';
import FormField from './FormField';

const COSMETIC_GRADES = ['A+', 'A', 'B', 'C'];
const PASS_FAIL = ['Pass', 'Fail'];
const CONDITION_OPTS = ['Excellent', 'Good', 'Fair', 'Poor', 'Dead'];
const YES_NO = ['Yes', 'No'];

export default function RefurbishmentGrade() {
  const { state, dispatch } = useFormContext();
  const data = state.refurbishment;

  const set = (e) =>
    dispatch({ type: 'UPDATE_FORM', section: 'refurbishment', payload: { [e.target.name]: e.target.value } });

  return (
    <div className="form-section">
      <h2>5. Refurbishment / Condition Grading</h2>
      <p className="section-note">Critical for Rekart — defines sellable condition of each device.</p>

      <h3>Grading</h3>
      <div className="form-grid">
        <FormField label="Cosmetic Grade" name="Cosmetic_Grade" value={data.Cosmetic_Grade} onChange={set} options={COSMETIC_GRADES} />
        <FormField label="Functional Grade" name="Functional_Grade" value={data.Functional_Grade} onChange={set} options={COSMETIC_GRADES} />
        <FormField label="Battery Health %" name="Battery_Health" value={data.Battery_Health} onChange={set} type="number" placeholder="87" />
        <FormField label="LCD Condition" name="LCD_Condition" value={data.LCD_Condition} onChange={set} options={CONDITION_OPTS} />
        <FormField label="Body Scratches" name="Body_Scratches" value={data.Body_Scratches} onChange={set} options={['None', 'Minor', 'Moderate', 'Heavy']} />
        <FormField label="Keyboard Condition" name="Keyboard_Condition" value={data.Keyboard_Condition} onChange={set} options={CONDITION_OPTS} />
        <FormField label="Touch Status" name="Touch_Status" value={data.Touch_Status} onChange={set} options={PASS_FAIL} />
        <FormField label="Speaker Status" name="Speaker_Status" value={data.Speaker_Status} onChange={set} options={PASS_FAIL} />
        <FormField label="Mic Status" name="Mic_Status" value={data.Mic_Status} onChange={set} options={PASS_FAIL} />
        <FormField label="Camera Status" name="Camera_Status" value={data.Camera_Status} onChange={set} options={PASS_FAIL} />
        <FormField label="Face ID / Touch ID" name="Face_Touch_ID" value={data.Face_Touch_ID} onChange={set} options={PASS_FAIL} />
        <FormField label="Ports Condition" name="Ports_Condition" value={data.Ports_Condition} onChange={set} options={CONDITION_OPTS} />
        <FormField label="Painted / Unpainted" name="Painted" value={data.Painted} onChange={set} options={['Painted', 'Yes', 'No']} />
        <FormField label="Parts Changed" name="Parts_Changed" value={data.Parts_Changed} onChange={set} type="textarea" placeholder="Battery, Screen..." />
        <FormField label="OEM Parts Used" name="OEM_Parts_Used" value={data.OEM_Parts_Used} onChange={set} options={YES_NO} />
        <FormField label="Warranty Seal Status" name="Warranty_Seal" value={data.Warranty_Seal} onChange={set} options={['Intact', 'Broken', 'N/A']} />
        <FormField label="QC Pass / Fail" name="QC_Result" value={data.QC_Result} onChange={set} options={PASS_FAIL} />
        <FormField label="Final Refurb Date" name="Final_Refurb_Date" value={data.Final_Refurb_Date} onChange={set} type="date" />
      </div>
    </div>
  );
}
