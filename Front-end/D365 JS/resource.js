function setFullName(executionContext) {
  const formContext = executionContext.getFormContext();
  const firstName = formContext.getAttribute("new_slot_first_name").getValue();
  const lastName = formContext.getAttribute("new_slot_last_name").getValue();

  if (!firstName || !lastName) return;

  formContext.getAttribute("new_name").setValue(firstName + " " + lastName);
}
