function correctId(id) {
  return id.replace('{','').replace('}','').toLowerCase()
}

function configureFieldName(executionContext) {
  const formContext = executionContext.getFormContext();
  const attribute = formContext.getAttribute("new_name");
  const control = formContext.getControl("new_name");
  if (attribute && control) {
    attribute.setRequiredLevel("none");
    control.setDisabled(true);
  }
}

function setName(executionContext) {
  const formContext = executionContext.getFormContext();
  const productLookup = formContext.getAttribute("new_fk_product").getValue();
  if (productLookup !== null) {
    formContext.getAttribute("new_name").setValue(productLookup[0].name);
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
  const controls = formContext.ui.controls.get();
  controls.forEach((control) => {
    const attribute = formContext.getAttribute(control.getName());
    if (
      attribute &&
      attribute.getName() !== "new_name" &&
      attribute.getName() !== "transactioncurrencyid" &&
      attribute.getName() !== "new_mon_price_per_unit"
    ) {
      control.setDisabled(isNewRecord ? false : true);
    }
  });
}

async function setCurrency(executionContext) {
  const formContext = executionContext.getFormContext();
  const inventoryLookup = formContext
    .getAttribute("new_fk_inventory")
    .getValue();
  if (inventoryLookup === null || !inventoryLookup.length) {
    formContext.getAttribute("transactioncurrencyid").setValue([
      {
        id: "1bac210e-8b5b-ef11-bfe2-002248a3ed7e",
        name: "US Dollar",
        entityType: "transactioncurrency",
      },
    ]);
    return
  };

  let inventoryId = inventoryLookup[0].id
    .replace("{", "")
    .replace("}", "")
    .toLowerCase();

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

  try {
    const result = await Xrm.WebApi.retrieveMultipleRecords(
      "new_inventory_product",
      fetchXml
    );
    if (result === null || !result.entities.length) return;
    formContext.getAttribute("transactioncurrencyid").setValue([
      {
        id: result.entities[0]["aj.transactioncurrencyid"],
        name: result.entities[0][
          "aj.transactioncurrencyid@OData.Community.Display.V1.FormattedValue"
        ],
        entityType: "transactioncurrency",
      },
    ]);
  } catch (error) {
    console.error(error.message);
  }
}


async function getPricePerUnit(executionContext) {
  const formContext = executionContext.getFormContext();

  const productLookup = formContext
      .getAttribute("new_fk_product")
      .getValue();
    if (productLookup === null || !productLookup.length) return;

    const productId = productLookup[0].id

    const inventoryLookup = formContext
      .getAttribute("new_fk_inventory")
      .getValue();
    if (inventoryLookup === null || !inventoryLookup.length) return

    const inventoryId = inventoryLookup[0].id

  let fetchXml = `
  <fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="true">
  <entity name="new_product">
    <attribute name="new_productid"/>
    <attribute name="new_name"/>
    <attribute name="new_mon_price_per_unit"/>
    <attribute name="transactioncurrencyid"/>
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

  try {
    const result = await Xrm.WebApi.retrieveMultipleRecords(
      "new_product",
      fetchXml
    );

    const filteredResult = result.entities.filter((item) => {
      if (
        item["new_productid"] === correctId(productId) &&
        item["ab.new_inventoryid"] === correctId(inventoryId)
      ) {
        return item;
      }
    });

    if(filteredResult.length) {
        formContext
          .getAttribute("new_mon_price_per_unit")
          .setValue(filteredResult[0]["ak.new_mon_price_per_unit"]);
        formContext.getAttribute("transactioncurrencyid").setValue([
          {
            id: filteredResult[0]["ak.transactioncurrencyid"],
            name: filteredResult[0][
              "ak.transactioncurrencyid@OData.Community.Display.V1.FormattedValue"
            ],
            entityType: "transactioncurrency",
          },
        ]);
    } else {
      const product = result.entities.filter((item) => item["new_productid"] === correctId(productId))[0]
      formContext
        .getAttribute("new_mon_price_per_unit")
        .setValue(product["new_mon_price_per_unit"]);
      formContext.getAttribute("transactioncurrencyid").setValue([
        {
          id: "1bac210e-8b5b-ef11-bfe2-002248a3ed7e",
          name: "US Dollar",
          entityType: "transactioncurrency",
        },
      ]);
    }

    calculateTotalAmount(executionContext);
  } catch (error) {
    console.error(error);
  }
}
