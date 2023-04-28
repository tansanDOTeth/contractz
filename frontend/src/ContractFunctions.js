import { FormControl, InputLabel, ListSubheader, MenuItem, Select } from '@mui/material';

import { useState } from 'react';

const getContractFunctionEntityKey = (contractFunction) => `${contractFunction.name}:${contractFunction.outputs.length}`

export const ContractFunctions = ({ contractFunctions, disabled, onSelect }) => {
  const [selectedFunctionKey, setSelectedFunctionKey] = useState('');
  const handleSelectedFunctionKey = ({ target: { value: key } }) => {
    setSelectedFunctionKey(key)
    const contractFunction = contractFunctions.find(contractFunction => getContractFunctionEntityKey(contractFunction) === key)
    onSelect(contractFunction)
  }

  return (
    <FormControl sx={{ minWidth: 250 }}>
      <InputLabel id="contract-functions">Contract Functions</InputLabel>
      <Select
        labelId="contract-functions"
        value={selectedFunctionKey}
        label="Contract Functions"
        onChange={handleSelectedFunctionKey}
        disabled={disabled || contractFunctions.length === 0}
      >
        <ListSubheader>Read</ListSubheader>
        {contractFunctions.filter(contractFunction => contractFunction.stateMutability === 'view').map((contractFunction) =>
          <MenuItem
            key={getContractFunctionEntityKey(contractFunction)}
            value={getContractFunctionEntityKey(contractFunction)}>{contractFunction.name}/{contractFunction.inputs.length}</MenuItem>
        )}

        <ListSubheader>Write</ListSubheader>
        {contractFunctions.filter(contractFunction => contractFunction.stateMutability !== 'view').map((contractFunction) =>
          <MenuItem
            key={getContractFunctionEntityKey(contractFunction)}
            value={getContractFunctionEntityKey(contractFunction)}>{contractFunction.name}/{contractFunction.inputs.length}</MenuItem>
        )}
      </Select>
    </FormControl>
  )
}