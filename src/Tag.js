import React from 'react'
import './Tag.css'

function Tag ({ children, number }) {
  return (
    <div className="tag">
      { children }
      <div className="number">
        { number }
      </div>
    </div>
  )
}

export default Tag