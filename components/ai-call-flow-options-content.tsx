"use client"

import { useState } from "react"
import {
    Search,
    X,
    ChevronDown,
    ChevronUp,
    Star,
    Bookmark,
    Info,
    List,
    Grid,
    ArrowDownWideNarrow,
    ArrowUpWideNarrow,
    Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface FilterTag {
    id: string
    label: string
}

interface MovieResult {
    id: number
    rank: number
    title: string
    year: number
    duration: string
    ageRating: string
    metascore: number
    rating: number
    ratingCount: string
    description: string
    image: string
}

export function AICallFlowOptionsContent() {
    const [titleSearch, setTitleSearch] = useState("live")
    const [selectedTypes, setSelectedTypes] = useState<string[]>(["Movie", "TV Series", "Podcast Series"])

    // Toggle states for sidebar filters
    const [isTitleNameExpanded, setIsTitleNameExpanded] = useState(true)
    const [isTitleTypeExpanded, setIsTitleTypeExpanded] = useState(true)

    // Derived state for global expand/collapse
    const isAllExpanded = isTitleNameExpanded && isTitleTypeExpanded

    const toggleAll = () => {
        const newState = !isAllExpanded
        setIsTitleNameExpanded(newState)
        setIsTitleTypeExpanded(newState)
    }

    const activeTags: FilterTag[] = [
        // { id: "top100", label: "IMDb Top 100 Movies" },
        { id: "title", label: `Title name: "live"` },
        { id: "movie", label: "Movie" },
        { id: "tv", label: "TV Series" },
        { id: "podcast", label: "Podcast Series" },
    ]

    const titleTypes = [
        "Movie", "TV Series", "Short", "TV Episode", "TV Mini Series", "TV Movie",
        "TV Special", "TV Short", "Video Game", "Video", "Music Video",
        "Podcast Series", "Podcast Episode"
    ]

    const results: MovieResult[] = [
        {
            id: 1,
            rank: 1,
            title: "The Lives of Others",
            year: 2006,
            duration: "2h 17m",
            ageRating: "15",
            metascore: 89,
            rating: 8.4,
            ratingCount: "441K",
            description: "In 1984 East Berlin, an agent of the secret police conducting surveillance on a writer and his lover finds himself becoming increasingly absorbed by their lives.",
            image: "https://m.media-amazon.com/images/M/MV5BMmI3Y2I4NWItODE0Mi00ZGNhLWI4YmMtY2E1YmZkODk4NWRmXkEyXkFqcGdeQXVyMTAwMzUyOTc@._V1_QL75_UX140_CR0,1,140,207_.jpg"
        }
    ]

    return (
        <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-950 p-4 md:p-6">
            <div className="max-w-[1200px] mx-auto space-y-12">
                <div className="flex flex-row justify-between">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Callpillot Flow Store</h1>
                    </div>
                </div>

                {/* Active Tags */}
                <div className="flex flex-wrap gap-2">
                    {activeTags.map(tag => (
                        <div key={tag.id} className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-full text-sm font-medium">
                            {tag.label}
                            <X className="w-4 h-4 cursor-pointer text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
                        </div>
                    ))}
                </div>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Search filters</h1>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleAll}
                            className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 text-sm bg-gray-50/50 dark:bg-gray-900/50 px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            {isAllExpanded ? (
                                <>Collapse all <ChevronUp className="w-4 h-4" /></>
                            ) : (
                                <>Expand all <ChevronDown className="w-4 h-4" /></>
                            )}
                        </button>
                    </div>

                    <div className="flex items-center gap-4 ml-auto">
                        <div className="flex items-center gap-2">
                            <button className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 text-sm bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded border border-gray-200 dark:border-gray-800">
                                Show Bookmarks
                            </button>
                            <button className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 text-sm bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded border border-gray-200 dark:border-gray-800">
                                Rating <ArrowUpWideNarrow className="w-4 h-4" /><ArrowDownWideNarrow className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
                    {/* Sidebar Filters */}
                    <aside className="space-y-6 border border-gray-200 dark:border-gray-800 rounded-xl p-6 bg-gray-50/30 dark:bg-gray-900/30 h-fit">
                        {/* Title Name Filter */}
                        <div className="space-y-3">
                            <div
                                className="flex items-center justify-between cursor-pointer group"
                                onClick={() => setIsTitleNameExpanded(!isTitleNameExpanded)}
                            >
                                <h3 className="font-bold text-sm">Title name</h3>
                                {isTitleNameExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
                                )}
                            </div>
                            {isTitleNameExpanded && (
                                <Input
                                    value={titleSearch}
                                    onChange={(e) => setTitleSearch(e.target.value)}
                                    className="h-10 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950"
                                />
                            )}
                        </div>

                        <div className="border-b border-gray-200 dark:border-white" />

                        {/* Title Type Filter */}
                        <div className="space-y-3">
                            <div
                                className="flex items-center justify-between cursor-pointer group"
                                onClick={() => setIsTitleTypeExpanded(!isTitleTypeExpanded)}
                            >
                                <h3 className="font-bold text-sm">Title type</h3>
                                {isTitleTypeExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
                                )}
                            </div>
                            {isTitleTypeExpanded && (
                                <div className="flex flex-wrap gap-2">
                                    {titleTypes.map(type => {
                                        const isSelected = selectedTypes.includes(type)
                                        return (
                                            <button
                                                key={type}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setSelectedTypes(selectedTypes.filter(t => t !== type))
                                                    } else {
                                                        setSelectedTypes([...selectedTypes, type])
                                                    }
                                                }}
                                                className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-1 transition-colors ${isSelected
                                                    ? "bg-blue-600 border-blue-600 text-white"
                                                    : "bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400"
                                                    }`}
                                            >
                                                {type}
                                                {isSelected && <X className="w-3 h-3" />}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* Main Results Container */}
                    <div className="space-y-4 border border-gray-200 dark:border-gray-800 rounded-xl p-6 bg-gray-50/30 dark:bg-gray-900/30">
                        {results.map(movie => (
                            <div key={movie.id} className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden flex shadow-sm hover:shadow-md transition-shadow">
                                {/* Movie Info */}
                                <div className="p-4 flex-1 space-y-1">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-4 items-start">
                                            {/* Image on left side of title */}
                                            <div className="p-2 w-20 h-28 border border-gray-200 dark:border-gray-600 rounded-md overflow-hidden bg-gray-50 dark:bg-gray-800 flex-shrink-0">
                                                <img src={movie.image} alt={movie.title} className="w-full h-full object-cover" />
                                            </div>

                                            <div className="space-y-1">
                                                <h2 className="text-lg font-bold group-hover:text-blue-600 cursor-pointer">
                                                    {movie.title}
                                                </h2>
                                                <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                                                    <span>Incoming / Outgoing</span>
                                                    <Info size={14} className="cursor-help" />
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                                                    <span>Category / Sub-Category</span>
                                                </div>

                                                <div className="flex items-center gap-4 py-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                        <span className="font-bold text-sm">{movie.rating}</span>
                                                        <span className="text-xs text-gray-400">({movie.ratingCount})</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <button className="p-2 px-6 hover:bg-blue-700 rounded text-white bg-blue-600 dark:bg-blue-600 transition-colors font-medium">
                                            View
                                        </button>
                                    </div>

                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-normal line-clamp-2 mt-2">
                                        {movie.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    )
}
