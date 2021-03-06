import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { NextPage } from "next";
import { useRouter } from "next/router";

import Head from "next/head";
import { useEffect, useState } from "react";

import { Stepper, Title, Button } from "../../components/Base";
import InfoRow from "../../components/InfoRow";
import Slideover from "../../components/Slideover";
import { checkProof, fetchSolidityData } from "../../lib/generateProof";
import { useProvider, useContractWrite, useConnect, useContractRead } from "wagmi";
import { ethers } from "ethers";

// const snarkjs = require("snarkjs");

enum Stage {
  LOADING = "Loading proof from IPFS...",
  INVALID = "Invalid IPFS hash :(",
  FINISHED = "Proof information",
}

const Share: NextPage = () => {
  const router = useRouter();
  const { ipfsHash } = router.query;

  const [stage, setStage] = useState<any>(Stage.LOADING);
  const [proof, setProof] = useState<any>(null);
  const [pubInputs, setPubInputs] = useState<any>(null);

  const [verifyStatus, setVerifyStatus] = useState<string>("Verify proof");

  useEffect(() => {
    async function getHash() {
      const resp = await fetch(`/api/getproof/${ipfsHash}`);
      const respData = JSON.parse(await resp.json());

      if (!resp.ok) {
        setStage(Stage.INVALID);
        return;
      }

      setProof(respData.proof);
      setPubInputs(respData.pubInputs);
      setStage(Stage.FINISHED);
    }

    if (ipfsHash) {
      getHash();
    }
  }, [ipfsHash]);

  // const verifyProofInBrowser = async () => {
  //   setVerifyStatus("Verifying...");
  //   try {
  //     const proofVerified = await checkProof(proof, pubInputs);
  //     if (proofVerified) {
  //       setVerifyStatus("Verified ✅");
  //     } else {
  //       setVerifyStatus("Proof is not valid");
  //     }
  //   } catch {
  //     setVerifyStatus("Proof is not valid");
  //   }
  // };


  const mintAbi = [
    {
      "inputs": [
        {
          "internalType": "uint256[2]",
          "name": "a",
          "type": "uint256[2]"
        },
        {
          "internalType": "uint256[2][2]",
          "name": "b",
          "type": "uint256[2][2]"
        },
        {
          "internalType": "uint256[2]",
          "name": "c",
          "type": "uint256[2]"
        },
        {
          "internalType": "uint256[4]",
          "name": "signals",
          "type": "uint256[4]"
        }
      ],
      "name": "mint",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalSupply",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  const provider = useProvider();
  console.log("provider", provider);

  // const solidityData = mintNftHelper(proof, pubInputs);
  const solidityData = proof && pubInputs ? fetchSolidityData(proof, pubInputs) : [];

  const { isConnected } = useConnect();
  
  //snarkjs.groth16ExportSolidityCallData(proof, pubInputs);
  const { data, isError, isLoading, write } = useContractWrite(
    {
      addressOrName: '0x2A0F14D7E66F1b7eFe53777C3655df66790eD795',
      contractInterface: mintAbi,
    },
    'mint',
    {
      args: solidityData
    }
  );

  console.log("proof", proof);
  console.log("pubInputs", pubInputs);
  console.log('solidityData', solidityData);
  console.log('isConnected', isConnected);
  console.log('data', data);
  console.log('isError', isError);
  console.log('isLoading', isLoading);
  console.log('write', write);
  console.log('lol');

  return (
    <>
      <div className="h-screen">
        <Head>
          <title>ETHdos</title>
          <link rel="icon" href="/favicon.ico" />
          <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Space+Mono" />
          {/* <script src="snarkjs.min.js"></script> */}
        </Head>

        <div className="flex h-full items-center justify-center text-white">
          <div className="w-1/2">
            <Stepper>ETHdos number</Stepper>


            <div className="my-5">
              {stage === Stage.LOADING && <Title>{stage}</Title>}
              {stage === Stage.INVALID && <Title>{stage}</Title>}
              {stage === Stage.FINISHED && (
                <>
                  <Title>{stage}</Title>
                  <InfoRow
                    name="Originator"
                    content={"0x" + BigInt(pubInputs![2]).toString(16)}
                  />
                  <InfoRow
                    name="Your distance"
                    content={parseInt(pubInputs![1]).toString()}
                  />
                  <InfoRow
                    name="Share with others"
                    content={
                      <a href={`http://ethdos.xyz/share/${ipfsHash}`}>
                        ethdos.xyz/share/{ipfsHash}
                      </a>
                    }
                  />
                </>
              )}
            </div>
            <div className="py-2">
              {stage === Stage.FINISHED && (
                <>
                <ConnectButton />
                <br />
                <Button onClick={() => write()} className="mr-5">Mint NFT</Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Share;