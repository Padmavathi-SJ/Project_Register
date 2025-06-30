export const signUpFormControls = [
  {
    name: "name",
    label: "User Name",
    placeholder: "Enter your user name",
    type: "text",
    componentType: "input",
  },
  {
    name: "emailId",
    label: "User Email",
    placeholder: "Enter your user email",
    type: "email",
    componentType: "input",
  },
  {
    name: "reg_num",
    label: "Register Number",
    placeholder: "Enter your user Register Number",
    type: "text",
    componentType: "input",
  },
  {
    name: "password",
    label: "Password",
    placeholder: "Enter your password",
    type: "password",
    componentType: "input",
  },
];

export const signInFormControls = [
  {
    name: "emailId",
    label: "User Email",
    placeholder: "Enter your user email",
    type: "email",
    componentType: "input",
  },
  {
    name: "password",
    label: "Password",
    placeholder: "Enter your password",
    type: "password",
    componentType: "input",
  },
];

export const initialSignInFormData = {
  emailId: "",
  password: "",
};

export const initialSignUpFormData = {
  name: "ajay",
  emailId: "ajay@gmail.com",
  reg_num: "201ee155",
  password: "SamS12@123",
};
