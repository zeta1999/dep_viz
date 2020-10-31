import jQuery from 'jquery'
import lodash from 'lodash'

import {
  COMPILE_LINE_STROKE,
  EXPORT_LINE_STROKE,
  RUNTIME_LINE_STROKE
} from '../constants.js'

import { findAllDependencies } from '../force_utils.js'
import { renderSelectedNode } from '../utils/render_utils.js'

const $topStats = jQuery('.highlight-box')
const $allFilesContainer = jQuery('.info-box-file-list-container')
let selectedNodeRendered = false

export class SelectedNodeDetails {
  constructor(targetObjects) {
    this.targetObjects = targetObjects
  }

  initialize(dependenciesMap) {
    this.dependenciesMap = dependenciesMap
  }

  infoBoxShowSelectedFilesDependencies(id, hideStatsAndFiles = true) {
    if (hideStatsAndFiles) doHideStatsAndFiles()

    jQuery('.info-box-file-tree').show()

    // For the current file render the file name
    jQuery('.info-box-file-tree .current-file').text(id)

    // underneath it render the name of each file it depends on and how it depends on it
    // Sort by compile, then export, then runtime

    const typeToOrder = d => {
      switch(d.type) {
        case 'compile': return 2
        case 'export': return 1
        case 'runtime': return 0
      }
    }

    const deps = lodash.orderBy(this.targetObjects[id], [typeToOrder], ['desc'])

    this.renderSelectedHeader(id, deps)

    const u = d3.select('.info-box-file-tree .file-tree')
                .selectAll('tr')
                .data(deps)

    const container = u.enter()
                       .append('tr')
                       .attr('class', '')

    const _label =
          container
          .append('td')
          .text(d => {
            switch(d.type) {
              case 'compile': return 'compile'
              case 'export': return 'export '
              case 'runtime': return 'runtime'
            }
          })
          .style('color', d => {
            switch(d.type) {
              case 'compile': return COMPILE_LINE_STROKE
              case 'export': return EXPORT_LINE_STROKE
              case 'runtime': return RUNTIME_LINE_STROKE
            }
          })
          .attr('class', 'm-r-4')
          .style('vertical-align', 'top')

    const file =
          container
          .append('td')

    file.append('div')
        .text(d => d.id)
        .attr('class', 'monospace')

    const compileContainers = file.filter(d => d.type === 'compile')
    compileContainers.append('div')
                     .attr('class', 'italic')
                     .html(d => {
                       const matched = findAllDependencies(this.targetObjects, d.id)
                       // Show count of files that this compile dependency depends on
                       const count = Object.keys(matched).length
                       // Subtract 1 to not include itself
                       return `this causes a compile dependency on <span class="compile-red">${count - 1}</span> additional files`
                     })
  }

  renderSelectedHeader(id, directDependencies) {
    const dependenciesMap = this.dependenciesMap
    const allDependencies = dependenciesMap[id]
    const depsCount = Object.keys(allDependencies).length

    let compileDepCount = 0
    Object.values(allDependencies).forEach(type => {
      if(type === 'compile' || type === 'export') compileDepCount++
    })

    if (directDependencies.length > 0) {
      jQuery('.info-box-file-tree .info-line-1').text(`… has ${depsCount - 1} dependencies (${compileDepCount - 1} compile time dependencies)`)
      jQuery('.info-box-file-tree .info-line-2').text('… has a direct dependency on these files:')
    } else {
      jQuery('.info-box-file-tree .info-line-1').text('… has no dependencies')
      jQuery('.info-box-file-tree .info-line-2').text('')
    }

    if (!selectedNodeRendered) {
      renderSelectNodeIndicator()
      selectedNodeRendered = true
    }
  }

  // Shows the direct depenencies of the given file id
  unShowFileTree(hideStatsAndFiles = true) {
    jQuery('.info-box-file-tree').hide()

    if (hideStatsAndFiles) {
      switch (window.vizState.infoBoxMode) {
        case 'stats':
          $topStats.show()
          break

        case 'all-files':
          $allFilesContainer.show()
          break
      }
    }

    const u = d3.select('.info-box-file-tree .file-tree')
                .selectAll('tr')
                .data([])

    u.exit().remove()
  }
}

function doHideStatsAndFiles() {
  switch (window.vizState.infoBoxMode) {
    case 'stats':
      $topStats.hide()
      break

    case 'all-files':
      $allFilesContainer.hide()
  }
}

function renderSelectNodeIndicator() {
  const data = [true]

  const g = d3.select('svg.selected-node-indicator')
              .selectAll('.selected-node')
              .data(data)
              .enter()

  renderSelectedNode(g, 10, 10)
}