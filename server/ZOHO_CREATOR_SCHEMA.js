/*
 * Zoho Creator — Form/Field Schema Reference
 * ============================================
 * This file documents the EXACT form names and field link-names
 * expected by the backend API. When you create forms in Zoho Creator,
 * use these names so the integration works out of the box.
 *
 * Zoho Creator does NOT have a public API to auto-create forms/fields.
 * You MUST create these manually in the Creator UI or via Deluge scripting.
 *
 * Quick steps:
 *   1. Go to https://creator.zoho.com
 *   2. Create an app named "rekart-inventory"
 *   3. Create each form below with the listed fields
 *   4. Field "Link Name" must match the Name column below (underscored)
 *
 * ──────────────────────────────────────────────────────────────────────
 *
 * FORM 1: Product_Master  (Report: Product_Master_Report)
 * ─────────────────────────────────
 *  Name               Type          Notes
 *  ─────────────────── ──────────── ──────────────────
 *  SKU                 Single Line
 *  Barcode             Single Line
 *  Brand               Single Line
 *  Category            Single Line
 *  Sub_Category        Single Line
 *  Product_Name        Single Line
 *  Model_Number        Single Line
 *  Series              Single Line
 *  Color               Single Line
 *  Storage_RAM         Single Line   e.g. "128GB / 4GB"
 *  Processor           Single Line
 *  Screen_Size         Single Line
 *  Keyboard_Layout     Single Line
 *  OS                  Single Line
 *  Product_Type        Dropdown      Values: New, Refurbished, Open Box, Used, Parts Only
 *
 *
 * FORM 2: Device_Tracking  (Report: Device_Tracking_Report)
 * ─────────────────────────────────
 *  IMEI_1              Single Line
 *  IMEI_2              Single Line
 *  Serial_Number       Single Line
 *  Service_Tag         Single Line
 *  Battery_Serial      Single Line
 *  Asset_Tag           Single Line
 *  Vendor_Lot_Number   Single Line
 *  Data_Wipe_Cert_ID   Single Line
 *  Diagnostic_Report_ID Single Line
 *  Grade_ID            Single Line
 *  QC_Engineer_Name    Single Line
 *  QC_Date             Date
 *  Laptop_Serial       Single Line
 *  Laptop_Service_Tag  Single Line
 *  Battery_Cycle_Count Number
 *  SSD_Health          Single Line
 *  Keyboard_Type       Single Line
 *
 *
 * FORM 3: Inventory_Stock  (Report: Inventory_Stock_Report)
 * ─────────────────────────────────
 *  Current_Stock       Number
 *  Available_Stock     Number
 *  Reserved_Stock      Number
 *  In_Transit_Stock    Number
 *  Repair_Stock        Number
 *  Dead_Stock          Number
 *  Returned_Stock      Number
 *  Damaged_Stock       Number
 *  RMA_Stock           Number
 *  Warehouse_Location  Single Line
 *  Bin_Rack_Shelf      Single Line
 *  Country_Warehouse   Single Line
 *  Supplier_Warehouse  Single Line
 *  Stock_Aging_Days    Number
 *  Last_Inward_Date    Date
 *  Last_Outward_Date   Date
 *  Reorder_Point       Number
 *  Minimum_Stock       Number
 *  Maximum_Stock       Number
 *  Lead_Time           Number
 *  Safety_Stock        Number
 *
 *
 * FORM 4: Pricing_Margin  (Report: Pricing_Margin_Report)
 * ─────────────────────────────────
 *  Vendor_Buy_Price    Decimal
 *  Landed_Cost         Decimal
 *  Import_Duty         Decimal
 *  VAT_Input           Decimal
 *  Repair_Cost         Decimal
 *  Accessory_Cost      Decimal
 *  Packaging_Cost      Decimal
 *  QC_Cost             Decimal
 *  Logistics_Inward    Decimal
 *  Refurbishment_Cost  Decimal
 *  Total_Cost_Price    Decimal
 *  MRP                 Decimal
 *  Retail_Selling_Price Decimal
 *  Wholesale_Price     Decimal
 *  B2B_Bulk_Price      Decimal
 *  Price_Amazon        Decimal
 *  Price_Noon          Decimal
 *  Website_Price       Decimal
 *  POS_Store_Price     Decimal
 *  Offer_Price         Decimal
 *  Coupon_Allowed      Dropdown      Values: Yes, No
 *  Min_Selling_Price   Decimal
 *  MAP_Price           Decimal
 *  Dealer_Price        Decimal
 *  Distributor_Price   Decimal
 *  Gross_Margin        Decimal
 *  Net_Margin          Decimal
 *  Contribution_Margin Decimal
 *  Breakeven_Price     Decimal
 *  Expected_Profit     Decimal
 *  Realized_Profit     Decimal
 *
 *
 * FORM 5: Refurbishment_Grade  (Report: Refurbishment_Grade_Report)
 * ─────────────────────────────────
 *  Cosmetic_Grade      Dropdown      Values: A+, A, B, C
 *  Functional_Grade    Dropdown      Values: A+, A, B, C
 *  Battery_Health      Number
 *  LCD_Condition       Dropdown      Values: Excellent, Good, Fair, Poor, Dead
 *  Body_Scratches      Dropdown      Values: None, Minor, Moderate, Heavy
 *  Keyboard_Condition  Dropdown      Values: Excellent, Good, Fair, Poor, Dead
 *  Touch_Status        Dropdown      Values: Pass, Fail
 *  Speaker_Status      Dropdown      Values: Pass, Fail
 *  Mic_Status          Dropdown      Values: Pass, Fail
 *  Camera_Status       Dropdown      Values: Pass, Fail
 *  Face_Touch_ID       Dropdown      Values: Pass, Fail
 *  Ports_Condition     Dropdown      Values: Excellent, Good, Fair, Poor, Dead
 *  Painted             Dropdown      Values: Painted, Unpainted
 *  Parts_Changed       Multi Line
 *  OEM_Parts_Used      Dropdown      Values: Yes, No
 *  Warranty_Seal       Dropdown      Values: Intact, Broken, N/A
 *  QC_Result           Dropdown      Values: Pass, Fail
 *  Final_Refurb_Date   Date
 *
 *
 * FORM 6: Marketplace_Channel  (Report: Marketplace_Channel_Report)
 * ─────────────────────────────────
 *  Amazon_ASIN         Single Line
 *  Noon_SKU            Single Line
 *  Shopify_SKU         Single Line
 *  Dubizzle_ID         Single Line
 *  OpenSooq_ID         Single Line
 *  Category_Mapping    Single Line
 *  SEO_Title           Single Line
 *  Short_Title         Single Line
 *  Marketplace_Bullets Multi Line
 *  Condition_Note      Multi Line
 *  Listing_Image_Folder Single Line
 *  Aplus_Content_Folder Single Line
 *  Ad_Priority         Dropdown      Values: High, Medium, Low, None
 *  Top_SKU_Flag        Dropdown      Values: Yes, No
 *  Exclusive_SKU_Flag  Dropdown      Values: Yes, No
 */
