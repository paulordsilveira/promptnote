  return (
    <nav className="sticky top-0 z-10 bg-black text-white px-4 py-3 flex justify-between items-center border-b border-purple-DEFAULT/20">
      <div className="flex items-center">
        <FileIcon className="h-5 w-5 mr-2 text-purple-light" />
        <span className="font-semibold">
          <span className="text-white">Prompt</span>
          <span className="text-yellow-400">Note</span>
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="px-2 py-1 text-xs rounded-full bg-gray-800 text-gray-400">
          v0.9
        </div>
      </div>
    </nav>
  ); 