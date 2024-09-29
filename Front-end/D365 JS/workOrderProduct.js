let productLookupPointer = null;

async function onChangeInventory(executionContext) {
  const formContext = executionContext.getFormContext();
  const inventoryRef = formContext.getAttribute("new_fk_inventory").getValue();

  if(productLookupPointer !== null) formContext.getControl("new_fk_product").removePreSearch(productLookupPointer);
  if(inventoryRef === null || !inventoryRef.length) return;

  const inventoryId = inventoryRef[0].id;

  let fetchXml = `
    <fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="true">
      <entity name="new_product">
      <attribute name="new_productid"/>
      <attribute name="new_name"/>
      <attribute name="createdon"/>
      <order attribute="new_name" descending="false"/>
      <filter type="and">
        <condition attribute="new_os_type" operator="eq" value="100000000"/>
      </filter>
        <link-entity name="new_inventory_product" from="new_fk_product" to="new_productid" link-type="inner" alias="ip">
          <filter type="and">
            <condition attribute="new_fk_inventory" operator="eq" value="${inventoryId}"/>
          </filter>
        </link-entity>
      </entity>
    </fetch>
  `;

  fetchXml = "?fetchXml=" + encodeURIComponent(fetchXml);

  const fetchResult = await Xrm.WebApi.retrieveMultipleRecords("new_product", fetchXml);
  const filteredProducts = fetchResult.entities;

  productLookupPointer = filterProducts.bind({ filteredProducts });

  formContext.getControl("new_fk_product").addPreSearch(productLookupPointer);
}

function filterProducts(executionContext) {

  const formContext = executionContext.getFormContext();
  const control = formContext.getControl("new_fk_product");
  if (!control) {
    console.error("Control not found: " + "new_fk_product");
    return;
  }

  let filter = `<filter type="or">`

  if (this.filteredProducts > 0) {
    this.filteredProducts.forEach((product) => {
      filter += `<condition attribute="new_productid" operator="eq" value="${product["new_productid"]}"/>`;
    });
  } else {
    filter += `<condition attribute="new_productid" operator="eq" value="{00000000-0000-0000-0000-000000000000}"/>`;
  }
    this.filteredProducts.forEach((product) => {
      filter += `<condition attribute="new_productid" operator="eq" value="${product["new_productid"]}"/>`;
    });

  filter += `</filter>`;

  control.addCustomFilter(filter, "new_product")
}

async function setInventory(executionContext) {
  const formContext = executionContext.getFormContext();
  const inventoryRef = formContext.getAttribute("new_fk_inventory").getValue();
  if(inventoryRef !== null) return

  const productRef = formContext.getAttribute("new_fk_product").getValue();
  if(productRef === null || !productRef.length) return;
  const productId = productRef[0].id;

  let fetchXml = `
    <fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="false" aggregate="true">
      <entity name="new_inventory_product">
      <attribute name="new_inventory_productid" groupby="true" alias="ipi"/>
      <attribute name="new_fk_inventory" groupby="true" alias="inventory"/>
      <attribute name="new_int_quantity" aggregate="max" alias="quantity"/>
        <filter type="and">
        <condition attribute="new_fk_product" operator="eq" value="${productId}"/>
        </filter>
      </entity>
    </fetch>
  `;

  fetchXml = "?fetchXml=" + encodeURIComponent(fetchXml)

  const fetchResult = await Xrm.WebApi.retrieveMultipleRecords("new_inventory_product", fetchXml);
  const filteredInventoryProducts = fetchResult.entities
  if (!filteredInventoryProducts.length) return;

  let result = filteredInventoryProducts[0];

  filteredInventoryProducts.forEach((inventoryProduct) => {
    if(inventoryProduct.quantity > result.quantity) {
      result = inventoryProduct
    }
  })

  formContext.getAttribute("new_fk_inventory").setValue([
    {
      id: result["inventory"],
      name: result["inventory@OData.Community.Display.V1.FormattedValue"],
      entityType: "new_inventory"
    },
  ]);
  setPricingValues(executionContext)
}

async function setPricingValues(executionContext) {
  const formContext = executionContext.getFormContext();
  const inventoryRef = formContext.getAttribute("new_fk_inventory").getValue();
  if (inventoryRef === null) return;
  inventoryId = inventoryRef[0].id;

  const productRef = formContext.getAttribute("new_fk_product").getValue();
  if (productRef === null) return;
  const productId = productRef[0].id;

  const [productCost, productDefaultPricePerUnit] = await getProductInfo(productId);

  const { currenciId, currencyName, productPricePerUnit, exchangerate } = await getPriceListInfo(inventoryId, productId);
    
  const currencyValue = {
    entityType: "transactioncurrency",
    id: currenciId,
    name: currencyName
  };
  const pricePerUnit = productPricePerUnit
    ? productPricePerUnit
    : productDefaultPricePerUnit * exchangerate;

  formContext.getAttribute("transactioncurrencyid").setValue([currencyValue]);
  formContext.getAttribute("new_mon_price_per_unit").setValue(pricePerUnit);
  formContext.getAttribute("new_mon_cost").setValue(productCost*exchangerate);
}

async function getProductInfo(id) {
  const product = await Xrm.WebApi.retrieveRecord("new_product", id, "?$select=new_mon_cost,new_mon_price_per_unit");
  return [product["new_mon_cost"], product["new_mon_price_per_unit"]];
}
async function getPriceListInfo(inventoryId, productId) {
  let fetchXmlPl = `
    <fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="true">
      <entity name="new_price_list">
        <attribute name="new_price_listid"/>
        <attribute name="new_name"/>
        <attribute name="transactioncurrencyid"/>
        <attribute name="exchangerate"/>
        <order attribute="new_name" descending="false"/>
          <link-entity name="new_inventory" from="new_fk_price_list" to="new_price_listid" link-type="inner" alias="iv">
            <filter type="and">
              <condition attribute="new_inventoryid" operator="eq" value="${inventoryId}"/>
            </filter>
          </link-entity>
      </entity>
    </fetch>
  `;

  fetchXmlPl = "?fetchXml=" + encodeURIComponent(fetchXmlPl);
  const fetchResultPl = await Xrm.WebApi.retrieveMultipleRecords(
    "new_price_list",
    fetchXmlPl
  );
  if (fetchResultPl === null || !fetchResultPl.entities.length) return;
  const priceList = fetchResultPl.entities[0];
  const [priceListId, currenciId, currencyName, exchangerate] = [
    priceList["new_price_listid"],
    priceList["_transactioncurrencyid_value"],
    priceList["_transactioncurrencyid_value@OData.Community.Display.V1.FormattedValue"],
    priceList["exchangerate"],
  ];

  let productPricePerUnit = null;

  let fetchXmlPlI = `
    <fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="false">
      <entity name="new_price_list_item">
        <attribute name="new_price_list_itemid"/>
        <attribute name="new_name"/>
        <attribute name="new_mon_price_per_unit"/>
        <order attribute="new_name" descending="false"/>
          <filter type="and">
            <condition attribute="new_fk_product" operator="eq" value="${productId}"/>
            <condition attribute="new_fk_price_list" operator="eq" value="${priceListId}"/>
          </filter>
      </entity>
    </fetch>
  `;

  fetchXmlPlI = "?fetchXml=" + encodeURIComponent(fetchXmlPlI);

  const fetchResultPlI = await Xrm.WebApi.retrieveMultipleRecords(
    "new_price_list_item",
    fetchXmlPlI
  );
  if (fetchResultPlI !== null && fetchResultPlI.entities.length) {
    productPricePerUnit = fetchResultPlI.entities[0]["new_mon_price_per_unit"];
  }

  return { currenciId, currencyName, productPricePerUnit, exchangerate };
}

function calculateTotalAmount(executionContext) {
  const formContext = executionContext.getFormContext();
  const quantity = formContext.getAttribute("new_int_quantity").getValue();
  const price = formContext.getAttribute("new_mon_price_per_unit").getValue();
  if (quantity !== null && price !== null) {
    const totalAmount = price * quantity;
    formContext.getAttribute("new_mon_total_amount").setValue(totalAmount);
  } else {
    formContext.getAttribute("new_mon_total_amount").setValue(0);
  }
}

async function onFormLoad(executionContext) {
  const formContext = executionContext.getFormContext();
  const ClosedPostedValue = 100000001;
  const workOrderRef = formContext.getAttribute("new_fk_work_order").getValue();
  if (workOrderRef === null) return;
  const workOrderId = workOrderRef[0].id;
  const workOrder = await Xrm.WebApi.retrieveRecord("new_work_order", workOrderId, "?$select=new_os_status");
  if(workOrder === null) return
  if(workOrder["new_os_status"] === ClosedPostedValue) {
    const controls = formContext.ui.controls.get();
    controls.forEach((control) => {
      control.setDisabled(true);
    });
  }
}