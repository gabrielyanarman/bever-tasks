async function openInventoryProductPopup(formContext) {
  const inventoryId = formContext.data.entity.getId();
  const priceListRef = formContext
    .getAttribute("new_fk_price_list")
    .getValue();
  if (priceListRef === null || !priceListRef.length) return;
  
  const priceListId = priceListRef[0].id;
  const pageInput = {
    pageType: "webresource",
    webresourceName: "new_html_inventory_product_popup",
    data: JSON.stringify({ inventoryId, priceListId }),
  };
  const navigationOptions = {
    target: 2,
    width: 800,
    height: 500,
    position: 1,
  };

  await Xrm.Navigation.navigateTo(pageInput, navigationOptions);
  formContext.getControl("inventory_products").refresh();
}
