import { useEffect, useState } from "react";

import { TextField } from "@mui/material";

export const ContractFunctionInputs = ({ contractFunction, onChange, disabled }) => {
  const [inputs, setInputs] = useState([]);

  useEffect(() => {
    if (contractFunction) {
      setInputs(contractFunction.inputs)
      onChange(contractFunction.inputs)
    }
  }, [contractFunction])

  const onTextChange = (index, { target: { value } }) => {
    inputs[index] = { ...inputs[index], value }
    const newInputs = [...inputs]
    setInputs(newInputs)
    onChange(newInputs)
  }
  return contractFunction?.inputs?.map((input, index) =>
    <TextField
      key={`${index}:${input.name}:${input.type}`}
      label={`${input.name || '<input>'} - ${input.type}`}
      variant="outlined"
      onChange={(event) => onTextChange(index, event)}
      disabled={disabled}
      sx={{ mb: 2 }} />
  )
}