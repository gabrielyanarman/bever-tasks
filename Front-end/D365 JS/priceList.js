function correctId(id) {
  return id.replace("{", "").replace("}", "").toLowerCase();
}

async function initializePriceList(formContext) {
  const priceListId = formContext.data.entity.getId();

  let fetchXml = `
        <fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="true">
            <entity name="new_product">
            <attribute name="new_productid"/>
            <attribute name="new_name"/>
            <order attribute="new_name" descending="false"/>
                <link-entity name="new_price_list_item" from="new_fk_product" to="new_productid" link-type="outer" alias="pli">
                    <attribute name="new_fk_price_list"/>
                    <attribute name="new_price_list_itemid"/>
                    <link-entity name="new_price_list" from="new_price_listid" to="new_fk_price_list" link-type="outer" alias="pl"/>
                </link-entity>
            </entity>
        </fetch>
    `;

  fetchXml = "?fetchXml=" + encodeURIComponent(fetchXml);

  const fetchResult = await Xrm.WebApi.retrieveMultipleRecords(
    "new_product",
    fetchXml
  );
  if (fetchResult === null || !fetchResult.entities.length) return;

  const filteredResult = fetchResult.entities.filter(
    (item) => item["pli.new_fk_price_list"] === correctId(priceListId)
  );

  const currencyRef = formContext
    .getAttribute("transactioncurrencyid")
    .getValue();
  if (currencyRef === null || !currencyRef.length) return;
  const currencyId = currencyRef[0].id;

  const products = fetchResult.entities.reduce((acc, product) => {
    if (
      !acc.some((item) => item["new_productid"] === product["new_productid"])
    ) {
      acc.push(product);
    }
    return acc;
  }, []);

  filteredResult.forEach(async (product) => {
    await Xrm.WebApi.deleteRecord(
      "new_price_list_item",
      product["pli.new_price_list_itemid"]
    );
  });

  products.forEach(async (product) => {
    const data = {
      ["new_name"]: product["new_name"],
      ["new_fk_price_List@odata.bind"]: `/new_price_lists(${correctId(
        priceListId
      )})`,
      ["new_fk_product@odata.bind"]: `/new_products(${product["new_productid"]})`,
      ["transactioncurrencyid@odata.bind"]: `/transactioncurrencies(${correctId(
        currencyId
      )})`,
      ["new_mon_price_per_unit"]: 1,
    };
    await Xrm.WebApi.createRecord("new_price_list_item", data);
  });

  formContext.getControl("price_list_item").refresh();
  
}
