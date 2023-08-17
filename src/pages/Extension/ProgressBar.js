import './ProgressBar.css'

const ProgressBar = ({ progress, color }) => {
  return (
    <div className="progressBar flex w-full bg-gray-100 rounded-full overflow-hidden h-4 mt-2">
      <div
        className="flex flex-col justify-center overflow-hidden text-xs text-white text-center"
        role="progressbar"
        style={{
          width: `${progress}%`,
          transition: "width 0.3s",
          backgroundColor: color
        }}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        {progress}%
      </div>
    </div>
  );
};

export default ProgressBar;
