
function checkType(executionContext) {
    const formContext = executionContext.getFormContext();
    const productType = formContext.getAttribute("new_os_type").getText();
    productType === "Product"
      ? formContext.getControl("new_mon_price_per_unit").setVisible(true)
      : formContext.getControl("new_mon_price_per_unit").setVisible(false);
}