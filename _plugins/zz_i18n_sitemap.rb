require 'cgi'
require 'find'

module BrickFictionI18nSitemap
  Jekyll::Hooks.register :polyglot, :post_write do |site|
    paths = html_paths(site).sort
    write_sitemap(site, paths)
  end

  class << self
    private

    def html_paths(site)
      paths = []

      Find.find(site.dest) do |file|
        next unless file.end_with?('.html')
        next unless File.file?(file)

        html = File.read(file)
        next if html.match?(/<meta\s+name=["']robots["'][^>]*noindex/i)

        paths << output_path(site, file)
      end

      paths
    end

    def output_path(site, file)
      relative = file.delete_prefix("#{site.dest}/")
      path = "/#{relative}"
      path = path.sub(%r{/index\.html\z}, '/')
      path = path.sub(%r{\.html\z}, '/')
      path == '/index.html' ? '/' : path
    end

    def write_sitemap(site, paths)
      xml = +"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
      xml << "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n"

      paths.each do |path|
        xml << "  <url>\n"
        xml << "    <loc>#{xml_escape(absolute_url(site, path))}</loc>\n"
        xml << "  </url>\n"
      end

      xml << "</urlset>\n"
      File.write(File.join(site.dest, 'sitemap.xml'), xml)
    end

    def absolute_url(site, path)
      "#{site_url(site)}#{path}"
    end

    def site_url(site)
      url = site.config['url'].to_s.sub(%r{/\z}, '')
      baseurl = site.config['baseurl'].to_s.sub(%r{/\z}, '')

      "#{url}#{baseurl}"
    end

    def xml_escape(value)
      CGI.escapeHTML(value.to_s)
    end
  end
end
