import { Box, Button, CircularProgress, Paper, TextField, Typography } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';

import { ContractFunctionInputs } from './ContractFunctionInputs';
import { ContractFunctions } from './ContractFunctions';
import CssBaseline from '@mui/material/CssBaseline';
import Web3 from 'web3';
import { grey } from '@mui/material/colors';
import { styled } from '@mui/system';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const Wrapper = styled(Box)({
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center'
});

export default function App() {
  const [contractAddress, setContractAddress] = useState('');
  const [contractFunctions, setContractFunctions] = useState([]);
  const [contractFunction, setContractFunction] = useState(undefined);
  const [contractFunctionInputs, setContractFunctionInputs] = useState([]);
  const [output, setOutput] = useState("");
  const [isFetching, setIsFetching] = useState(false);

  const handleContractAddressChange = ({ target: { value: contractAddress } }) => {
    // Check if this is a valid address first
    if (Web3.utils.isAddress(contractAddress)) {
      setContractAddress(contractAddress);
    }
  };

  const handleRun = () => {
    const url = `${process.env.REACT_APP_API_HOST}/contracts/${contractAddress}/run`;
    const { type, name } = contractFunction;
    const data = {
      type,
      name,
      inputs: contractFunctionInputs
    }

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }

    fetch(url, options)
      .then(response => response.json())
      .then(({ result }) => setOutput(result))
  }

  useEffect(() => {
    if (contractAddress.length === 0) return
    setIsFetching(true)
    const url = `${process.env.REACT_APP_API_HOST}/contracts/${contractAddress}/abi`;
    fetch(url)
      .then(response => response.json())
      .then(response => response.abi.filter(item => item.type === 'function'))
      .then(setContractFunctions)
      .then(() => setIsFetching(false))
      .catch(console.error)
  }, [contractAddress])

  useEffect(() => {
    setOutput('')
  }, [contractAddress, contractFunction])


  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Wrapper>
        <Paper sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'start', p: 5 }} elevation={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative', minWidth: 250 }}>
            <TextField
              label="Contract Address"
              variant="outlined"
              onChange={handleContractAddressChange} disabled={isFetching}
              sx={{ mb: 3, minWidth: 250 }} />
            {isFetching && <CircularProgress size='1rem' sx={{ position: 'absolute', right: 12 }} />}
          </Box>
          <ContractFunctions
            contractFunctions={contractFunctions}
            onSelect={setContractFunction}
            disabled={isFetching} />
        </Paper>
        <Paper sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'start', minWidth: 250, p: 4 }}>
          <Typography variant="overline" gutterBottom>Inputs {contractFunction?.inputs?.length && `(${contractFunction?.inputs.length})`}</Typography>

          {contractFunction
            ? <ContractFunctionInputs
              onChange={setContractFunctionInputs}
              contractFunction={contractFunction}
              disabled={isFetching} />
            : <Typography color={grey[500]}>Select a function</Typography>
          }

          <Button variant="contained" onClick={handleRun} disabled={isFetching || contractFunction?.inputs.length !== contractFunctionInputs.filter(input => 'value' in input && input.value.length > 0).length}>Run</Button>

          <Box>
            <Typography variant='overline'>Output</Typography>
            <Typography variant='body1'>
              {output || ''}
            </Typography>
          </Box>
        </Paper>
      </Wrapper>
    </ThemeProvider>
  );
}

