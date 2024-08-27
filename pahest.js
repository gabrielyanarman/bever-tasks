async function getPricePerUnit(executionContext) {
  const formContext = executionContext.getFormContext();

  const productLookup = formContext.getAttribute("new_fk_product").getValue();
  if (productLookup === null || !productLookup.length) return;

  const productId = productLookup[0].id;

  let fetchXml = `
    <fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="true">
      <entity name="new_inventory_product">
      <attribute name="new_inventory_productid"/>
      <attribute name="new_name"/>
      <attribute name="createdon"/>
      <order attribute="new_name" descending="false"/>
      <filter type="and">
        <condition attribute="new_fk_product" operator="eq" value="${productId}"/>
      </filter>
        <link-entity name="new_inventory" from="new_inventoryid" to="new_fk_inventory" link-type="inner" alias="aa">
          <attribute name="new_inventoryid"/>
          <link-entity name="new_price_list" from="new_price_listid" to="new_fk_price_list" link-type="inner" alias="ab">
            <link-entity name="new_price_list_item" from="new_fk_price_list" to="new_price_listid" link-type="inner" alias="ac">
              <attribute name="new_mon_price_per_unit"/>
            </link-entity>
          </link-entity>
        </link-entity>
        <link-entity name="new_product" from="new_productid" to="new_fk_product" link-type="inner" alias="ad">
          <attribute name="new_mon_price_per_unit"/>
        </link-entity>
      </entity>
    </fetch>
  `;

  fetchXml = "?fetchXml=" + encodeURIComponent(fetchXml);

  try {
    const result = await Xrm.WebApi.retrieveMultipleRecords(
      "new_inventory_product",
      fetchXml
    );

    console.log(result);

    const inventoryLookup = formContext
      .getAttribute("new_fk_inventory")
      .getValue();
    if (inventoryLookup === null || !inventoryLookup.length) {
      formContext
        .getAttribute("new_mon_price_per_unit")
        .setValue(result.entities[0]["ad.new_mon_price_per_unit"]);
      calculateTotalAmount(executionContext);
      return;
    }
    const inventoryId = inventoryLookup[0].id
      .replace("{", "")
      .replace("}", "")
      .toLowerCase();
    const filteredResult = result.entities.filter((item) => {
      if (item["aa.new_inventoryid"] === inventoryId) return item;
    });

    filteredResult.length
      ? formContext
          .getAttribute("new_mon_price_per_unit")
          .setValue(filteredResult[0]["ac.new_mon_price_per_unit"])
      : formContext
          .getAttribute("new_mon_price_per_unit")
          .setValue(result.entities[0]["ad.new_mon_price_per_unit"]);

    calculateTotalAmount(executionContext);
  } catch (error) {
    console.error(error);
  }
}

// async function getPricePerUnit(executionContext) {
//   const formContext = executionContext.getFormContext();

//   let fetchXml = `
//     <fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="true">
//       <entity name="new_product">
//         <attribute name="new_productid"/>
//         <attribute name="new_name"/>
//         <attribute name="new_mon_price_per_unit"/>
//         <attribute name="transactioncurrencyid"/>
//         <order attribute="new_name" descending="false"/>
//         <link-entity name="new_inventory_product" from="new_fk_product" to="new_productid" link-type="outer" alias="ai">
//           <link-entity name="new_inventory" from="new_inventoryid" to="new_fk_inventory" link-type="outer" alias="aj">
//             <attribute name="new_name"/>
//             <attribute name="new_inventoryid"/>
//             <link-entity name="new_price_list" from="new_price_listid" to="new_fk_price_list" link-type="outer" alias="ab">
//              <link-entity name="new_price_list_item" from="new_fk_price_list" to="new_price_listid" link-type="outer" alias="ac">
//                <attribute name="new_fk_price_list"/>
//                <attribute name="new_mon_price_per_unit"/>
//              </link-entity>
//            </link-entity>
//           </link-entity>
//         </link-entity>
//       </entity>
//     </fetch>
//   `;

//   fetchXml = "?fetchXml=" + encodeURIComponent(fetchXml);

//   try {
//     const result = await Xrm.WebApi.retrieveMultipleRecords(
//       "new_product",
//       fetchXml
//     );

//     console.log("result ", result)

//     const productLookup = formContext
//       .getAttribute("new_fk_product")
//       .getValue();
//     if (productLookup === null || !productLookup.length) return;

//     const productId = productLookup[0].id
//       .replace("{", "")
//       .replace("}", "").toLocaleLowerCase();

//     const inventoryLookup = formContext
//       .getAttribute("new_fk_inventory")
//       .getValue();
//     if (inventoryLookup === null || !inventoryLookup.length) {
//       // formContext.getAttribute("new_mon_price_per_unit").setValue(result.entities[0]["ad.new_mon_price_per_unit"]);
//       // calculateTotalAmount(executionContext);
//       return;
//     }
//     const inventoryId = inventoryLookup[0].id
//       .replace("{", "")
//       .replace("}", "")
//       .toLocaleLowerCase();

//     const filteredResult = result.entities.map((item) => {
//         if (
//           item["new_productid"] === productId &&
//           (item["aj.new_inventoryid"] === inventoryId ||
//             !item["aj.new_inventoryid"])
//         )
//           return item;
//       });
//     console.log("product id ", productId)
//     console.log("inventory id ", inventoryId);
//     console.log("filtered result ", filteredResult)

//     //   filteredResult.length
//     //     ? formContext
//     //         .getAttribute("new_mon_price_per_unit")
//     //         .setValue(filteredResult[0]["ac.new_mon_price_per_unit"])
//     //     : formContext
//     //         .getAttribute("new_mon_price_per_unit")
//     //         .setValue(result.entities[0]["ad.new_mon_price_per_unit"]);

//     //   calculateTotalAmount(executionContext);
//   } catch (error) {
//     console.error(error);
//   }
// }
