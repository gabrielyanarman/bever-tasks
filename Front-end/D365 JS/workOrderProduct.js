let productLookupPointer = null;

async function onChangeInventory(executionContext) {
  const formContext = executionContext.getFormContext();
  const inventoryLookup = formContext.getAttribute("new_fk_inventory").getValue();

  if(productLookupPointer !== null) formContext.getControl("new_fk_product").removePreSearch(productLookupPointer);
  if(inventoryLookup === null || !inventoryLookup.length) return;

  const inventoryId = inventoryLookup[0].id;

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

  try {
    const fetchResult = await Xrm.WebApi.retrieveMultipleRecords("new_product", fetchXml);
    const filteredProducts = fetchResult.entities;

    productLookupPointer = filterProducts.bind({ filteredProducts });

    formContext.getControl("new_fk_product").addPreSearch(productLookupPointer);
  } catch (error) {
    console.error(error)
  } 
}

function filterProducts(executionContext) {

  const formContext = executionContext.getFormContext();
  const control = formContext.getControl("new_fk_product");
  if (!control) {
    console.error("Control not found: " + "new_fk_product");
    return;
  }

  let filter = `<filter type="or">`


  this.filteredProducts.forEach((product) => {
    filter += `<condition attribute="new_productid" operator="eq" value="${product["new_productid"]}"/>`;
  })

  filter += `</filter>`;

  control.addCustomFilter(filter, "new_product")
}