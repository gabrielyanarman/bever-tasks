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