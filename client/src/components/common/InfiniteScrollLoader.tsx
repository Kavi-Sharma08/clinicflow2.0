const InfiniteScrollLoader = () => (
  <div className="w-full h-1 bg-gray-100 overflow-hidden relative">
    <div className="absolute inset-y-0 left-0 w-1/3 bg-[#0057A8] animate-loading-bar" />
  </div>
);

export default InfiniteScrollLoader;