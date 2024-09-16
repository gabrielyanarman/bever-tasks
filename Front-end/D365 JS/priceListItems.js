async function setCurrencyFromPriceListLookup(executionContext) {
  const formContext = executionContext.getFormContext();
  const priceListRef = formContext
    .getAttribute("new_fk_price_list")
    .getValue();

  if (priceListRef !== null) {
    const priceListId = priceListRef[0].id;
    const result = await Xrm.WebApi.retrieveRecord(
      "new_price_list",
      priceListId,
      "?$select=_transactioncurrencyid_value"
    );
    const currencyId = result._transactioncurrencyid_value;
    const currencyName =result["_transactioncurrencyid_value@OData.Community.Display.V1.FormattedValue"];

    formContext.getAttribute("transactioncurrencyid").setValue([
      {
        id: currencyId,
        name: currencyName,
        entityType: "transactioncurrency",
      }
    ]);
  }
}

function setNameFromProduct(executionContext) {
  const formContext = executionContext.getFormContext();
  const product = formContext.getAttribute("new_fk_product").getValue();

  product !== null
    ? formContext.getAttribute("new_name").setValue(product[0].name)
    : formContext.getAttribute("new_name").setValue("");
}
