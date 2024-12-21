import React, {useState, useEffect } from 'react';
import { Link } from 'react-scroll'; 
import { ethers } from 'ethers';
import Image from './assets/logo.png';
import { Github, CopyCheck, Copy } from 'lucide-react'; 
import { motion } from 'framer-motion';

import DemoComponent from './DemoComponent';

function App() {

  const [isCopied, setIsCopied] = useState(false);
  const [typedText, setTypedText] = useState("");
  const frameworks = ["React", "Vue.js", "Next.js", "Gatsby", "Svelte", "Angular"];
  const [index, setIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  const handleCopy = () => {
    navigator.clipboard.writeText('npm install web3-react-hooks');
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000); 
  };

  useEffect(() => {
    const typingEffect = setInterval(() => {
      if (charIndex < frameworks[index].length) {
        setTypedText((prev) => prev + frameworks[index].charAt(charIndex));
        setCharIndex((prev) => prev + 1);
      } else {
        setTimeout(() => {
          setTypedText("");
          setCharIndex(0);
          setIndex((prev) => (prev + 1) % frameworks.length);
        }, 1000);
      }
    }, 150);

    return () => clearInterval(typingEffect);
  }, [charIndex, frameworks, index]);


  return (
    <div className="bg-gradient-to-r from-gray-900 to-black text-white font-poppins">

      <motion.nav
        className="backdrop-blur-md text-white fixed top-0 w-full z-50 shadow-lg transition-all duration-300"
        id="navbar"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto py-4 flex justify-between items-center">
          {/* Logo and Project Name on the Left */}
          <div className="flex items-center space-x-3">
            <img src={Image} alt="Logo" className="w-16 h-16 object-cover rounded-full" />
            <h1 className="text-2xl font-bold">Web3Connect</h1>
          </div>

          {/* Navigation Links in the Center */}
          <div className="flex space-x-6 text-lg font-semibold justify-center flex-grow">
            <Link
              to="features"
              smooth={true}
              duration={500}
              className="hover:text-[#00bfff] transition duration-300 cursor-pointer font-poppins"
            >
              Features
            </Link>
            <Link
              to="demo"
              smooth={true}
              duration={500}
              className="hover:text-[#1e90ff] transition duration-300 cursor-pointer"
            >
              Demonstration
            </Link>
            <Link
              to="sample"
              smooth={true}
              duration={500}
              className="hover:text-[#1e90ff] transition duration-300 cursor-pointer"
            >
              Code Samples
            </Link>

          <Link
            to="https://github.com/Rushhaabhhh/Web3ReactHooks"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#1e90ff] transition duration-300 cursor-pointer"
            >
             GitHub
          </Link>
          </div>



          
        </div>
      </motion.nav>

      {/* Hero Section with transparent background */}
      <div className="py-40 bg-transparent" id="home">
      <div className="container mx-auto px-6 flex justify-between items-center">
        {/* Left side: Texts */}
        <div className="flex-1">
          <motion.h1
            className="text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            Engineered from a Pain Point, Introducing to You
          </motion.h1>
          <motion.h2
            className="text-6xl font-extrabold text-indigo-600 mb-6"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, type: "spring", stiffness: 100 }}
          >
            <motion.span
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="relative inline-block"
            >
              'Web3 React Hooks'
              <span className="absolute -bottom-2 left-0 w-full h-1 bg-indigo-600 transition-all duration-500 transform scale-x-0 origin-left group-hover:scale-x-100"></span>
            </motion.span>
          </motion.h2>
          <motion.h3
            className="text-3xl font-semibold mb-6"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >

            <span>A Simple Solution of Web3 Integration</span> <br/>
            <span>for All React Frameworks</span>
          </motion.h3>

          {/* Typing Animation for Frameworks */}
          <motion.div
            className="text-6xl text-gray-300 mt-4 mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
          >
            <span>{typedText}</span>
            <span className="text-transparent">|</span>
          </motion.div>

          {/* Left-side paragraph beneath the title */}
          <motion.p
            className="text-lg text-gray-400 mt-6"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 1 }}
          >
            Web3 React Hooks offer a simple and efficient way to manage Web3 interactions in your React applications. With hooks tailored to streamline blockchain connectivity and Ethereum interactions, you can integrate decentralized technology into your apps effortlessly and without the hassle.
          </motion.p>
        </div>



        {/* Right side: Code Snippet */}
        <div className="flex-1 text-center">
          <motion.div
            className="bg-gray-800 text-white p-6 rounded-lg shadow-lg py-10 w-3/4 mx-auto"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-xl block mb-4">Install with npm : </span>
            <div className="flex items-center justify-center space-x-4">
              <code className="bg-gray-900 text-white p-4 rounded-lg text-lg">
                npm install web3-react-hooks
              </code>
              <button
                onClick={handleCopy}
                className="flex items-center text-indigo-500 hover:text-indigo-700 p-2"
              >
                {isCopied ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <CopyCheck size={20} />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Copy size={20} />
                  </motion.div>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>


            {/* Features Section */}
            <section className="container mx-auto px-6 py-20" id="features">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold">Features</h2>
              <p className="mt-4 text-lg">Unlock the full potential of blockchain with these tools</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

              {/* <!-- Gas Estimation --> */}
              <div className="bg-gray-800 p-8 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300">
                <h3 className="text-2xl font-bold">Gas Estimator</h3>
                <p className="mt-4">Estimate gas fees to optimize transaction costs across networks.</p>
              </div>

              {/* <!-- Wallet Connection --> */}
              <div className="bg-gray-800 p-8 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300">
                <h3 className="text-2xl font-bold">Wallet Connection</h3>
                <p className="mt-4">Seamlessly connect your wallet for transactions across blockchains.</p>
              </div>

              {/* <!-- Transaction Status --> */}
              <div className="bg-gray-800 p-8 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300">
                <h3 className="text-2xl font-bold">Transaction Status</h3>
                <p className="mt-4">Track the status of your blockchain transactions in real time.</p>
              </div>
            </div>
          </section>


      {/* Demo Section */}

      <div id='demo' className="container mx-auto px-6 py-20">
      <DemoComponent />
      </div>

      {/* Code Section */}
      <section className="container mx-auto px-6 py-20" id="sample">
  <div className="text-center mb-16">
    <h2 className="text-4xl font-bold">Code Samples</h2>
    <p className="mt-4 text-lg">Track transactions, estimate gas, and manage your wallet seamlessly!</p>
  </div>

  <div className="space-y-12">
    {/* Transaction Status Hook */}
    <div className="bg-gray-800 p-8 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300">
      <h3 className="text-2xl font-bold">Transaction Status</h3>
      <p className="mt-4">Monitor your blockchain transaction status in real-time.</p>
      <pre className="bg-gray-700 text-green-400 p-4 rounded-lg overflow-auto mt-4">
        {`import { useTransactionStatus } from './Hooks/useTransactionStatus';`}
        <br />
        {`function TransactionStatusDemo() {`}
        <br />
        {`  const { status, txHash } = useTransactionStatus("sampleTxHash");`}
        <br />
        {`  return (`}
        <br />
        {`    <div>`}
        <br />
        {`      <p className="text-white">Transaction Status: {status}</p>`}
        <br />
        {`      <p className="text-white">Transaction Hash: {txHash}</p>`}
        <br />
        {`    </div>`}
        <br />
        {`  );`}
        <br />
        {`}`}
      </pre>
    </div>

    {/* Gas Estimator Hook */}
    <div className="bg-gray-800 p-8 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300">
      <h3 className="text-2xl font-bold">Gas Estimator</h3>
      <p className="mt-4">Estimate transaction costs to optimize your blockchain interactions.</p>
      <pre className="bg-gray-700 text-green-400 p-4 rounded-lg overflow-auto mt-4">
        {`import { useGasEstimator } from './Hooks/useGasEstimator';`}
        <br />
        {`function GasEstimatorDemo() {`}
        <br />
        {`  const { estimation, error, loading } = useGasEstimator("sampleTransactionData");`}
        <br />
        {`  return (`}
        <br />
        {`    <div>`}
        <br />
        {`      {loading && <p className="text-white">Loading...</p>}`}
        <br />
        {`      {error && <p className="text-red-400">Error: {error.message}</p>}`}
        <br />
        {`      {estimation && <p className="text-white">Estimated Gas: {estimation.gasLimit}</p>}`}
        <br />
        {`    </div>`}
        <br />
        {`  );`}
        <br />
        {`}`}
      </pre>
    </div>

    {/* Wallet Hook */}
    <div className="bg-gray-800 p-8 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300">
      <h3 className="text-2xl font-bold">Wallet Management</h3>
      <p className="mt-4">Connect, manage, and interact with your crypto wallet.</p>
      <pre className="bg-gray-700 text-green-400 p-4 rounded-lg overflow-auto mt-4">
        {`import { useWallet } from './Hooks/useWallet';`}
        <br />
        {`function WalletDemo() {`}
        <br />
        {`  const { walletAddress, connectWallet, disconnectWallet } = useWallet();`}
        <br />
        {`  return (`}
        <br />
        {`    <div>`}
        <br />
        {`      {!walletAddress ? (`}
        <br />
        {`        <button onClick={connectWallet} className="text-white">Connect Wallet</button>`}
        <br />
        {`      ) : (`}
        <br />
        {`        <div>`}
        <br />
        {`          <p className="text-white">Address: {walletAddress}</p>`}
        <br />
        {`          <button onClick={disconnectWallet} className="text-red-400">Disconnect</button>`}
        <br />
        {`        </div>`}
        <br />
        {`      )}`}
        <br />
        {`    </div>`}
        <br />
        {`  );`}
        <br />
        {`}`}
      </pre>
    </div>
  </div>
</section>




      {/* Footer Section */}
      <footer className="bg-gray-900 py-8">
        <div className="container mx-auto text-center">
          <p className="text-lg">&copy; 2024 Web3 React Hooks. All Rights Reserved.</p>
          <div className='text-lg mt-2'>
          <span> Made by </span> 
          <span> 
          <a
              href="https://github.com/Rushhaabhhh/Web3ReactHooks"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#1e90ff] transition duration-300"
            >
            Rushhaabhhh</a>
          </span>
          </div>
          <div className="mt-4">
            <a href="#privacy" className="text-green-500 hover:text-green-400">Privacy Policy</a> | 
            <a href="#terms" className="text-green-500 hover:text-green-400"> Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
