function checkType(executionContext) {
  const formContext = executionContext.getFormContext();
  const productTypeValue = formContext.getAttribute("new_os_type").getValue();
  const serviceTypeValue = 100000001;
  if (productTypeValue !== serviceTypeValue) {
    formContext.getControl("new_mon_cost").setVisible(true);
  } else {
    formContext.getControl("new_mon_cost").setVisible(false);
  }
}
