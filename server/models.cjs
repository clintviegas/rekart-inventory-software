/*
 * Mongoose models.
 *
 * Field names mirror the legacy Zoho Creator schema so the existing
 * frontend (which reads/writes `Customer_Name`, `Service_Type`,
 * `Available_Stock`, etc.) doesn't need to change.
 */
const { mongoose } = require('./db.cjs');
const { Schema } = mongoose;

/* ─── User (for simple email/password auth) ──────────────────── */
const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    name: { type: String },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
  },
  { timestamps: true },
);

/* ─── Product Master ─────────────────────────────────────────── */
const ProductSchema = new Schema(
  {
    SKU: { type: String, required: true, unique: true, index: true },
    Barcode: String,
    Brand1: String,
    Category: String,
    Sub_Category: String,
    Product_Name: { type: String, index: true },
    Model_Number: { type: String, index: true },
    Series: String,
    Color: String,
    Storage_RAM: String,
    Processor: String,
    Screen_Size: String,
    Keyboard_Layout: String,
    OS: String,
    Product_Type: String,
  },
  { timestamps: { createdAt: 'Added_Time', updatedAt: 'Modified_Time' } },
);

/* ─── Device Tracking (serials/IMEI) ─────────────────────────── */
const DeviceSchema = new Schema(
  {
    SKU: { type: String, index: true },
    IMEI_1: String,
    IMEI_2: String,
    Serial_Number: { type: String, index: true },
    Service_Tag: String,
    Battery_Serial: String,
    Asset_Tag: String,
    Vendor_Lot_Number: String,
    Data_Wipe_Cert_ID: String,
    Diagnostic_Report_ID: String,
    Grade_ID: String,
    QC_Engineer_Name: String,
    QC_Date: Date,
    Laptop_Serial: String,
    Laptop_Service_Tag: String,
    Battery_Cyle_Count: Number,
    SSD_Health: String,
    Keyboard_Type: String,
  },
  { timestamps: { createdAt: 'Added_Time', updatedAt: 'Modified_Time' } },
);

/* ─── Inventory Stock (one row per SKU) ──────────────────────── */
const InventorySchema = new Schema(
  {
    SKU: { type: String, required: true, unique: true, index: true },
    Current_Stock: { type: Number, default: 0 },
    Available_Stock: { type: Number, default: 0 },
    Reserved_Stock: { type: Number, default: 0 },
    In_Transit_Stock: { type: Number, default: 0 },
    Repair_Stock: { type: Number, default: 0 },
    Dead_Stock: { type: Number, default: 0 },
    Returned_Stock: { type: Number, default: 0 },
    Damaged_Stock: { type: Number, default: 0 },
    RMA_Stock: { type: Number, default: 0 },
    Warehouse_Location: String,
    Bin_Rack_Shelf: String,
    Country_Warehouse: String,
    Supplier_Warehouse: String,
    Stock_Aging_Days: Number,
    Last_Inward_Date: Date,
    Last_Outward_Date: Date,
    Reorder_Point: Number,
    Minimum_Stock: Number,
    Maximum_Stock: Number,
    Lead_Time: Number,
    Safety_Stock: Number,
  },
  { timestamps: { createdAt: 'Added_Time', updatedAt: 'Modified_Time' } },
);

/* ─── Pricing & Margin ───────────────────────────────────────── */
const PricingSchema = new Schema(
  {
    SKU: { type: String, required: true, unique: true, index: true },
    Vendor_Buy_Price: Number,
    Landed_Cost: Number,
    Import_Duty: Number,
    VAT_Input: Number,
    Repair_Cost: Number,
    Accessory_Cost: Number,
    Packaging_Cost: Number,
    QC_Cost: Number,
    Logistic_Inward: Number,
    Refurbishment_Cost1: Number,
    Total_Cost_Price: Number,
    MRP: Number,
    Retail_Selling_Price: Number,
    Wholesale_Price: Number,
    B2B_Bulk_Price: Number,
    Price_Amazon: Number,
    Price_Noon: Number,
    Website_Price: Number,
    POS_Store_Price: Number,
    Offer_Price: Number,
    Coupon_Allowed: String,
    Min_Selling_Price: Number,
    MAP_Price: Number,
    Dealer_Price: Number,
    Distributor_Price: Number,
    Gross_Margin: Number,
    Net_Margin: Number,
    Contribution_Margin: Number,
    Breakeven_Price: Number,
    Expected_Profit: Number,
    Realised_Profit: Number,
  },
  { timestamps: { createdAt: 'Added_Time', updatedAt: 'Modified_Time' } },
);

/* ─── Refurbishment Grade ────────────────────────────────────── */
const RefurbishmentSchema = new Schema({}, { strict: false, timestamps: { createdAt: 'Added_Time', updatedAt: 'Modified_Time' } });

/* ─── Marketplace Channel ────────────────────────────────────── */
const MarketplaceSchema = new Schema({}, { strict: false, timestamps: { createdAt: 'Added_Time', updatedAt: 'Modified_Time' } });

/* ─── Customer Master ────────────────────────────────────────── */
const CustomerSchema = new Schema(
  {
    Customer_Name: String,
    Phone: { type: String, index: true },
    Email: String,
    Address: String,
    City: String,
    Loyalty_Tier: { type: String, default: 'New' },
    Notes: String,
  },
  { timestamps: { createdAt: 'Added_Time', updatedAt: 'Modified_Time' } },
);

/* ─── Order Master ───────────────────────────────────────────── */
const OrderSchema = new Schema(
  {
    Order_ID: { type: String, unique: true, index: true },
    Customer_Name: { type: String, required: true },
    Customer_Phone: String,
    Customer_Email: String,
    Customer_Ref: { type: Schema.Types.ObjectId, ref: 'Customer' },
    Service_Type: { type: String, required: true, index: true },
    Product_SKU: { type: String, index: true },
    Device_Description: String,
    Amount: { type: Number, default: 0 },
    Payment_Mode: { type: String, default: 'Pending' },
    Status: { type: String, default: 'Pending', index: true },
    Order_Date: { type: String },
    Location: String,
    Handled_By: String,
    Notes: String,
    Fault_Description: String,
    Estimated_Delivery: String,
    Technician: String,
    Trade_In_Value: Number,
    Rental_Start_Date: String,
    Rental_End_Date: String,
    Stock_Adjusted: { type: String, default: 'No' },
  },
  { timestamps: { createdAt: 'Added_Time', updatedAt: 'Modified_Time' } },
);

/* Auto-generate human-readable Order_ID: RKT-XXXXXX */
OrderSchema.pre('validate', function () {
  if (!this.Order_ID) {
    const rand = Math.random().toString(16).slice(2, 8).toUpperCase();
    this.Order_ID = `RKT-${rand}`;
  }
  if (!this.Order_Date) {
    this.Order_Date = new Date().toISOString().slice(0, 10);
  }
});

function model(name, schema, collection) {
  return mongoose.models[name] || mongoose.model(name, schema, collection);
}

const Models = {
  User:          model('User',          UserSchema,          'users'),
  Product:       model('Product',       ProductSchema,       'products'),
  Device:        model('Device',        DeviceSchema,        'devices'),
  Inventory:     model('Inventory',     InventorySchema,     'inventory'),
  Pricing:       model('Pricing',       PricingSchema,       'pricing'),
  Refurbishment: model('Refurbishment', RefurbishmentSchema, 'refurbishment'),
  Marketplace:   model('Marketplace',   MarketplaceSchema,   'marketplace'),
  Customer:      model('Customer',      CustomerSchema,      'customers'),
  Order:         model('Order',         OrderSchema,         'orders'),
};

// Map frontend section keys (used by the existing CRUD API) to models.
const SECTION_MODELS = {
  product:       Models.Product,
  device:        Models.Device,
  inventory:     Models.Inventory,
  pricing:       Models.Pricing,
  refurbishment: Models.Refurbishment,
  marketplace:   Models.Marketplace,
};

module.exports = { ...Models, SECTION_MODELS };
