function onChangeInventory(executionContext) {
    const formContext = executionContext.getFormContext();
    formContext.getControl("new_fk_product").addPreSearch(createProductsCustomView);
}

function createProductsCustomView(executionContext) {
  const formContext = executionContext.getFormContext();
  const control = formContext.getControl("new_fk_product");
  if (!control) {
    console.error("Control not found: " + "new_fk_product");
    return;
  }

  const inventoryLookup = formContext.getAttribute("new_fk_inventory").getValue();
  let isInventorySelected = true;
  let inventoryId = null;

  if (inventoryLookup === null || !inventoryLookup.length) {
    isInventorySelected = false;
  } else {
    inventoryId = inventoryLookup[0].id;
  }

  const fetchXmlProducts = `
    <fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="false">
        <entity name="new_product">
            <attribute name="new_productid"/>
            <attribute name="new_name"/>
            <attribute name="createdon"/>
            <order attribute="new_name" descending="false"/>
            <filter type="and">
                <condition attribute="new_os_type" operator="eq" value="100000000"/>
            </filter>
        </entity>
    </fetch>
  `;

  const fetchXmlFilteredProducts = `
    <fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="true">
        <entity name="new_product">
        <attribute name="new_productid"/>
        <attribute name="new_name"/>
        <attribute name="createdon"/>
        <order attribute="new_name" descending="false"/>
        <filter type="and">
            <condition attribute="new_os_type" operator="eq" value="100000000"/>
        </filter>
        <link-entity name="new_inventory_product" from="new_fk_product" to="new_productid" link-type="inner" alias="ab">
            <filter type="and">
                <condition attribute="new_fk_inventory" operator="eq" value="${inventoryId}"/>
            </filter>
        </link-entity>
        </entity>
    </fetch>
  `;

  const fetchXml = isInventorySelected ? fetchXmlFilteredProducts : fetchXmlProducts;

  const viewId = "00000000-0000-0000-0000-000000000111";
  const viewDisplayName = "Filtered View";
  const layoutXml = `
    <grid name="resultset" object="1" jump="id" select="1" icon="1" preview="1">
    <row name="result" id="new_productid">
        <cell name="new_name" width="150" />
        <cell name="createdon" width="150" />
    </row>
    </grid>
  `;

  control.addCustomView(
    viewId,
    "new_product",
    viewDisplayName,
    fetchXml,
    layoutXml,
    true
  );
}