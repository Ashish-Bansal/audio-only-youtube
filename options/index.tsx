import { useEffect, useState } from "react"
import './options.css'

function OptionsPage() {
	const [showThumbnail, setShowThumbnail] = useState(false)

	useEffect(() => {
		chrome.storage.sync.get(
		  {
			showThumbnail: true,
		  },
		  function(items) {
			setShowThumbnail(items.showThumbnail);
		  }
		);
	}, [])


	function saveOptions(showThumbnail: boolean) {
		chrome.storage.sync.set({
			showThumbnail: showThumbnail,
		});
		setShowThumbnail(showThumbnail);
	}

	return (
		<div className="options-container">
			<h2 className="options-title">Options</h2>
			<div className="show-thumbnail-switch-container">
				<div>Show thumbnail while video plays:</div>
				<label className="show-thumbnail-switch">
					<input
						type="checkbox"
						id="show-thumbnail"
						checked={showThumbnail}
						onChange={(e) => saveOptions(e.target.checked)}
					/>
					<span className="show-thumbnail-slider show-thumbnail-slider--round"></span>
				</label>
			</div>
		</div>
	)
}


export default OptionsPage
