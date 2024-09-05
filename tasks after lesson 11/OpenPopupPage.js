async function openInventoryProductPopup(formContext) {
  const inventoryId = formContext.data.entity.getId();
  const priceListLookup = formContext.getAttribute("new_fk_price_list").getValue();
  if(priceListLookup === null || !priceListLookup.length) return ;

  const priceListId = priceListLookup[0].id;
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

  try {
    await Xrm.Navigation.navigateTo(pageInput, navigationOptions);
  } catch (error) {
    console.error(error);
    Xrm.Navigation.openAlertDialog({ text: error.message });
  }

  formContext.getControl("inventory_products").refresh();
}