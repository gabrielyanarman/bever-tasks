function correctId(id) {
  return id.replace('{','').replace('}','').toLowerCase()
}

function setName(executionContext) {
  const formContext = executionContext.getFormContext();
  const productRef = formContext.getAttribute("new_fk_product").getValue();
  if (productRef !== null) {
    formContext.getAttribute("new_name").setValue(productRef[0].name);
    return;
  }
  formContext.getAttribute("new_name").setValue("");
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

function toggleFields(executionContext) {
  const formContext = executionContext.getFormContext();
  const isNewRecord = formContext.ui.getFormType() === 1;
  if(isNewRecord) return
  const controls = formContext.ui.controls.get();
  controls.forEach((control) => {
    control.setDisabled(true);
  });
}

async function setCurrency(executionContext) {
  const formContext = executionContext.getFormContext();
  const inventoryRef = formContext
    .getAttribute("new_fk_inventory")
    .getValue();
  if (inventoryRef === null || !inventoryRef.length) return

  let inventoryId = inventoryRef[0].id;

  let fetchXml = `<fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="false">
    <entity name="new_inventory_product">
      <attribute name="new_inventory_productid"/>
      <attribute name="new_name"/>
      <attribute name="createdon"/>
      <order attribute="new_name" descending="false"/>
      <filter type="and">
        <condition attribute="new_fk_product" operator="not-null"/>
        <condition attribute="new_fk_inventory" operator="eq" value="${inventoryId}"/>
      </filter>
      <link-entity name="new_inventory" from="new_inventoryid" to="new_fk_inventory" link-type="inner" alias="ai">
        <link-entity name="new_price_list" from="new_price_listid" to="new_fk_price_list" link-type="inner" alias="aj">
          <attribute name="transactioncurrencyid"/>
        </link-entity>
      </link-entity>
    </entity>
  </fetch>`;

  fetchXml = "?fetchXml=" + encodeURIComponent(fetchXml);

  const result = await Xrm.WebApi.retrieveMultipleRecords(
    "new_inventory_product",
    fetchXml
  );
  if (result !== null ) {
    formContext.getAttribute("transactioncurrencyid").setValue([
      {
        id: result.entities[0]["aj.transactioncurrencyid"],
        name: result.entities[0][
          "aj.transactioncurrencyid@OData.Community.Display.V1.FormattedValue"
        ],
        entityType: "transactioncurrency",
      },
    ]);
  }
}


async function getPricePerUnit(executionContext) {
  const formContext = executionContext.getFormContext();
  const productRef = formContext.getAttribute("new_fk_product").getValue();
    const inventoryRef = formContext.getAttribute("new_fk_inventory").getValue();

  if (
    productRef === null ||
    !productRef.length ||
    inventoryRef === null ||
    !inventoryRef.length
  ) {
    formContext.getAttribute("new_mon_price_per_unit").setValue(null);
    calculateTotalAmount(executionContext);
    return;
  };

  const productId = productRef[0].id;
  const inventoryId = inventoryRef[0].id;

  let fetchXml = `
  <fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="true">
  <entity name="new_product">
    <attribute name="new_productid"/>
    <attribute name="new_name"/>
    <attribute name="new_mon_price_per_unit"/>
    <attribute name="transactioncurrencyid"/>
    <attribute name="exchangerate"/>
    <order attribute="new_name" descending="false"/>
    <link-entity name="new_inventory_product" from="new_fk_product" to="new_productid" link-type="outer" alias="ai">
      <link-entity name="new_inventory" from="new_inventoryid" to="new_fk_inventory" link-type="outer" alias="aj">
        <filter type="and">
          <condition attribute="new_inventoryid" operator="eq" value="${inventoryId}"/>
        </filter>
        <attribute name="new_fk_price_list"/>
      </link-entity>
    </link-entity>
    <link-entity name="new_price_list_item" from="new_fk_product" to="new_productid" link-type="outer" alias="ak">
      <attribute name="new_fk_price_list"/>
      <attribute name="new_mon_price_per_unit"/>
      <attribute name="transactioncurrencyid"/>
        <filter type="and">
          <condition attribute="new_fk_product" operator="eq" value="${productId}"/>
        </filter>
        <link-entity name="new_price_list" from="new_price_listid" to="new_fk_price_list" link-type="outer" alias="aa">
        <link-entity name="new_inventory" from="new_fk_price_list" to="new_price_listid" link-type="outer" alias="ab">
          <attribute name="new_inventoryid"/>
        </link-entity>
    </link-entity>
    </link-entity>
  </entity>
</fetch>
  `;

  fetchXml = "?fetchXml=" + encodeURIComponent(fetchXml);

  const result = await Xrm.WebApi.retrieveMultipleRecords(
    "new_product",
    fetchXml
  );

  if (result === null || !result.entities.length) return;

  const filteredResult = result.entities.filter((item) => {
    if (
      item["new_productid"] === correctId(productId) &&
      item["ab.new_inventoryid"] === correctId(inventoryId)
    ) {
      return item;
    }
  });

  const currencyRef = formContext
    .getAttribute("transactioncurrencyid")
    .getValue();

  const currencyId = currencyRef[0].id;

  const currency = await Xrm.WebApi.retrieveRecord(
    "transactioncurrency",
    currencyId,
    "?$select=exchangerate"
  );

  const currencyExchangeRate = currency.exchangerate;

  if (filteredResult.length) {
    formContext
      .getAttribute("new_mon_price_per_unit")
      .setValue(filteredResult[0]["ak.new_mon_price_per_unit"]);

  } else {
    const product = result.entities.filter(
      (item) => item["new_productid"] === correctId(productId)
    )[0];
    product["exchangerate"] === currencyExchangeRate
      ? formContext
          .getAttribute("new_mon_price_per_unit")
          .setValue(product["new_mon_price_per_unit"])
      : formContext
          .getAttribute("new_mon_price_per_unit")
          .setValue(product["new_mon_price_per_unit"]*currencyExchangeRate);
  }

  calculateTotalAmount(executionContext);
  
}

async function checkInventoryProductExistence(executionContext) {
  const formContext = executionContext.getFormContext();
  const inventoryRef = formContext.getAttribute("new_fk_inventory").getValue()
  const productRef = formContext.getAttribute("new_fk_product").getValue();
  if (
    inventoryRef === null ||
    !inventoryRef.length ||
    productRef === null ||
    !productRef.length
  ) {
    formContext.getControl("new_fk_product").clearNotification(1);
    return
  }
  const inventoryId = inventoryRef[0].id;
  const productId = productRef[0].id;

  let fetchXml = `
    <fetch> version="1.0" output-format="xml-platform" mapping="logical" distinct="false">
      <entity name="new_inventory_product">
      <attribute name="new_inventory_productid"/>
      <attribute name="new_name"/>
      <attribute name="new_fk_product"/> 
      <order attribute="new_name" descending="false"/>
        <filter type="and">
        <condition attribute="new_fk_inventory" operator="eq" value="${inventoryId}"/>
        <condition attribute="new_fk_product" operator="eq" value="${productId}"/>
        </filter>
      </entity>
    </fetch>
  `;

  fetchXml = "?fetchXml=" + encodeURIComponent(fetchXml);

  const fetchResult = await Xrm.WebApi.retrieveMultipleRecords('new_inventory_product', fetchXml)

  if (fetchResult === null || !fetchResult.entities.length) {
    formContext.getControl("new_fk_product").clearNotification(1);
    return
  };

  formContext
    .getControl("new_fk_product")
    .setNotification("Product is already added", 1);
} 