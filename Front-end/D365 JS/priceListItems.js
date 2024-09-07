async function setCurrencyFromPriceListLookup(executionContext) {
  const formContext = executionContext.getFormContext();
  const priceListLookup = formContext
    .getAttribute("new_fk_price_list")
    .getValue();

  if (priceListLookup !== null && priceListLookup.length) {
    const priceListId = priceListLookup[0].id
      .replace("{", "")
      .replace("}", "")
      .toLowerCase();
    try {
      const result = await Xrm.WebApi.retrieveRecord(
        "new_price_list",
        priceListId
      );
      const currencyId = result._transactioncurrencyid_value;
      const currencyName =
        result[
          "_transactioncurrencyid_value@OData.Community.Display.V1.FormattedValue"
        ];

      formContext.getAttribute("transactioncurrencyid").setValue([
        {
          id: currencyId,
          name: currencyName,
          entityType: "transactioncurrency",
        },
      ]);
    } catch (error) {
      console.error(error.message);
    }
  }
}

function setNameFromProduct(executionContext) {
  const formContext = executionContext.getFormContext();
  const product = formContext.getAttribute("new_fk_product").getValue();

  product !== null && product.length
    ? formContext.getAttribute("new_name").setValue(product[0].name)
    : formContext.getAttribute("new_name").setValue("");
}
